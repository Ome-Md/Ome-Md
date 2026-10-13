"""Exercise the real HTTP API and PostgreSQL persistence; never print credentials."""
import http.cookiejar
import json
import os
import urllib.error
import urllib.request
import uuid
from pathlib import Path

BASE = os.environ.get('ACADEMY_TEST_URL', 'http://127.0.0.1:3000')
RUN = uuid.uuid4().hex[:8]
results = []


from helpers import Actor



def passed(label):
    results.append(label)
    print('PASS:', label, flush=True)


credentials = json.loads(Path(os.environ.get('ACADEMY_TEST_CREDENTIALS','.academy-data/demo-credentials.json')).read_text())
manager, trainer, other = Actor(), Actor(), Actor()
for actor, key in [(manager, 'admin'), (trainer, 'trainer'), (other, 'second')]:
    actor.login(credentials[key]['email'], credentials[key]['password'])
initial = manager.request('bootstrap')
cohort = next(c for c in initial['cohorts'] if c['name'] == 'Commerce Cohort 01')
invited = manager.request('users', {'email': f'acceptance-{RUN}@demo.drcommerce.test', 'name': f'Acceptance Trainee {RUN}', 'role': 'student', 'cohortId': cohort['id']})
learner = Actor()
learner.login(invited['profile']['email'], invited['temporaryPassword'])
boot = learner.request('bootstrap')
student_id = boot['user']['id']
assert len(boot['cohorts']) == 1 and boot['cohorts'][0]['id'] == cohort['id']
assert len(boot['students']) == 1 and len(boot['lessons']) == 45
assert not any('script' in lesson for lesson in boot['lessons'])
if not boot['demo']:
    learner.request('auth/demo', {'role':'admin'}, expected=403)
passed('1. Newly enrolled learner signs in with only their assigned cohort/course')

lessons = {l['day']: l for l in boot['lessons']}
learner.request('lessons/' + lessons[8]['id'], expected=403)
learner.request('live/publish', {}, expected=403)
learner.request('branding', {}, method='PUT', expected=403)
other_record = other.request('submissions', {'formKey': 'F01', 'data': {'title': 'Private scope test ' + RUN}, 'classification': 'synthetic'})
learner.request('submissions/' + other_record['id'], expected=403)
trainer.request('submissions/' + other_record['id'], expected=403)
assert not any(s['id'] == other_record['id'] for s in trainer.request('bootstrap')['submissions'])
passed('8/9. Cohort privacy, role enforcement and live-operation gates reject unauthorized actions')

from fixtures import training_templates
templates=training_templates(RUN)

parents = {'F03': 'F02', 'F04': 'F02', 'F05': 'F02', 'F06': 'F04', 'F07': 'F06', 'F08': 'F06', 'F09': 'F08', 'F10': 'F08', 'F11': 'F10', 'F12': 'F10', 'F13': 'F10', 'F14': 'F08'}
latest = {}


def prepare(day):
    lesson = learner.request('lessons/' + lessons[day]['id'])
    learner.request('lessons/' + lesson['id'] + '/checklist', {c['id']: True for c in lesson['content']['checklist']}, method='PATCH')
    key = lesson['form_key']
    values = dict(templates[key])
    values['title'] += f' — day {day} — {RUN}'
    record = learner.request('submissions', {'formKey': key, 'lessonId': lesson['id'], 'parentId': latest.get(parents.get(key)), 'data': values, 'classification': 'synthetic'})
    return lesson, record


def submit(record):
    learner.evidence(record['id'])
    return learner.request('submissions/' + record['id'] + '/submit', {'revision': record['revision']})


def review(record, decision='approved', score=92, comments='Synthetic evaluation: required evidence and operating controls are correctly documented.', fields=None, critical=False, expected=200):
    return trainer.request('submissions/' + record['id'] + '/review', {'revision': record['revision'], 'decision': decision, 'score': score, 'comments': comments, 'fieldComments': fields or [], 'critical': critical}, expected=expected)


assessment = next(a for a in boot['assessments'] if a['gate'] == 1)
result = learner.request('assessments/' + assessment['id'], [1, 2, 0, 0, 1])
assert result['passed'] and result['score'] == 100
learner.request('lessons/' + lessons[8]['id'], expected=403)
for day in range(1, 8):
    _, record = prepare(day)
    latest[record['form_key']] = review(submit(record))['id']
assert max(g['gate'] for g in learner.request('bootstrap')['gates']) == 1
learner.request('submissions', {'formKey':'F01','lessonId':lessons[8]['id'],'data':templates['F01'],'classification':'synthetic'}, expected=422)
day8, record = prepare(8)
assert 'script' not in day8 and len(day8['content']['steps']) >= 4
assert all(day8['content']['checklist'])
passed('2. Day 8 opens only after foundation evidence and approvals; readiness checklist persists')

learner.request('submissions/' + record['id'] + '/submit', {'revision': record['revision']}, expected=422)
evidence = learner.evidence(record['id'])
other.request('files/' + evidence['id'], expected=403)
record = learner.request('submissions/' + record['id'] + '/submit', {'revision': record['revision']})
assert record['status'] == 'submitted'
learner.request('submissions/' + record['id'] + '/review', {'revision': record['revision'], 'decision': 'approved', 'score': 100, 'comments': 'Learner may not approve their own work.'}, expected=403)
learner.request('submissions', {'formKey': 'F04', 'parentId': record['id'], 'data': {}, 'classification': 'synthetic'}, expected=403)
passed('3. Research draft, attributable evidence upload and submission are persisted')

record = review(record, 'changes_requested', 65, 'Clarify which completed listings actually sold. Keep the synthetic classification explicit.', [{'field': 'evidenceNote', 'comment': 'Distinguish confirmed sold status from unsold completed listings.'}])
assert record['status'] == 'changes_requested' and record['feedback'][0]['field_comments'][0]['field'] == 'evidenceNote'
assert any(n['submission_id'] == record['id'] for n in learner.request('bootstrap')['notifications'])
passed('4. Assigned trainer requests a correction on the precise evidence field')

changed = dict(record['data'])
changed['evidenceNote'] = 'Synthetic correction: completed listings are not counted as sold unless sold status is confirmed. Original sources and the first revision remain retained.'
record = learner.request('submissions', {'id': record['id'], 'formKey': 'F02', 'revision': record['revision'], 'data': changed, 'classification': 'synthetic'}, method='PATCH')
assert record['history'] and record['feedback']
record = learner.request('submissions/' + record['id'] + '/submit', {'revision': record['revision']})
passed('5. Learner corrects and resubmits without losing review or revision history')
record = review(record)
latest['F02'] = record['id']
assert record['status'] == 'approved'
assert max(g['gate'] for g in learner.request('bootstrap')['gates']) == 2
sourcing = learner.request('submissions', {'formKey': 'F04', 'lessonId': lessons[12]['id'], 'parentId': record['id'], 'data': templates['F04'], 'classification': 'synthetic'})
assert sourcing['parent_id'] == record['id']
passed('6. Trainer approval unlocks sourcing with the same persistent research identity')

day8_id = record['id']
for day in range(9, 46):
    _, record = prepare(day)
    if day == 12:
        invalid = dict(record['data']); invalid['rating'] = 4.5
        record = learner.request('submissions', {'id': record['id'], 'formKey': 'F04', 'revision': record['revision'], 'data': invalid, 'classification': 'synthetic'}, method='PATCH')
        learner.evidence(record['id'])
        learner.request('submissions/' + record['id'] + '/submit', {'revision': record['revision']}, expected=422)
        record = learner.request('submissions', {'id': record['id'], 'formKey': 'F04', 'revision': record['revision'], 'data': templates['F04'], 'classification': 'synthetic'}, method='PATCH')
    if day == 28:
        invalid = dict(record['data']); invalid.update(variant='Red', quantity=1)
        record = learner.request('submissions', {'id': record['id'], 'formKey': 'F10', 'revision': record['revision'], 'data': invalid, 'classification': 'synthetic'}, method='PATCH')
        learner.evidence(record['id'])
        learner.request('submissions/' + record['id'] + '/submit', {'revision': record['revision']}, expected=422)
        record = learner.request('submissions', {'id': record['id'], 'formKey': 'F10', 'revision': record['revision'], 'data': templates['F10'], 'classification': 'synthetic'}, method='PATCH')
    record = submit(record)
    if day == 43:
        review(record, critical=True, expected=422)
        record = review(record, 'changes_requested', 92, 'A critical control is missing. Correct the operational permission explanation before approval.', [{'field': 'controls', 'comment': 'Make the prohibition on unauthorized live actions explicit.'}], critical=True)
        revised = dict(record['data']); revised['controls'] += ' Never authorize live publishing, purchases, refunds or account changes through a quiz or training gate alone.'
        record = learner.request('submissions', {'id': record['id'], 'formKey': 'F15', 'revision': record['revision'], 'data': revised, 'classification': 'synthetic'}, method='PATCH')
        record = learner.request('submissions/' + record['id'] + '/submit', {'revision': record['revision']})
    record = review(record)
    latest[record['form_key']] = record['id']
    if day in (43, 44):
        assert not learner.request('bootstrap')['certificates'], 'Final certification must wait for all 45 approved daily practical milestones.'
    if day == 15:
        result = record['calculation']
        assert round(result['roi'], 1) == 143.8 and abs(result['investment'] - 2.412) < 1e-8
        assert result['inTarget'] is False
        passed('7. Stored stopwatch costing gives 143.8% ROI and requires exception review')

final = learner.request('bootstrap')
assert len([l for l in final['lessons'] if l['completed']]) == 45
assert max(g['gate'] for g in final['gates']) == 7
assert len(final['certificates']) == 1
assert set(latest) == set(templates)
passed('C/D. All 15 operational forms and all 45 daily practical workflows complete with evidence and reviews')
assessed = learner.request('submissions/'+latest['F15'])
override = {'revision':assessed['revision'],'decision':'changes_requested','score':95,'comments':'Management found a critical operating-control omission after reassessment.','fieldComments':[{'field':'controls','comment':'Renew the explicit prohibition on unauthorized live operations.'}],'critical':True,'overrideReason':'Synthetic acceptance reassessment with documented supporting control evidence.'}
trainer.request('submissions/'+assessed['id']+'/review',override,expected=403)
learner.request('submissions/'+assessed['id']+'/review',override,expected=403)
manager.request('submissions/'+assessed['id']+'/review',{**override,'decision':'approved'},expected=422)
assessed=manager.request('submissions/'+assessed['id']+'/review',override)
suspended=learner.request('bootstrap')
assert suspended['certificates'][0]['status']=='review_required' and not any(g['gate']==7 for g in suspended['gates'])
assert len([l for l in suspended['lessons'] if l['completed']])==44
assessed=learner.request('submissions',{'id':assessed['id'],'formKey':'F15','revision':assessed['revision'],'data':{**assessed['data'],'controls':str(assessed['data']['controls'])+' Reassessed: no training score authorizes live operations.'},'classification':'synthetic'},method='PATCH')
assessed=learner.request('submissions/'+assessed['id']+'/submit',{'revision':assessed['revision']})
review(assessed)
assert learner.request('bootstrap')['certificates'][0]['status']=='qualified'
assert any(a['action']=='assessment.management_override' for a in manager.request('bootstrap')['audit'])
print('ADDITIONAL PASS: Audited management reassessment suspends certification until critical failure and the missing milestone are resolved.',flush=True)
learner.request('auth/logout', {})
learner.request('submissions/' + day8_id, expected=401)
learner.login(invited['profile']['email'], invited['temporaryPassword'])
persisted = learner.request('submissions/' + day8_id)
assert persisted['status'] == 'approved' and len(persisted['feedback']) >= 2 and persisted['history']
assert len(learner.request('bootstrap')['certificates']) == 1
passed('10. Progress, evidence, corrections, approvals and certification persist after logout/login')

lesson = trainer.request('lessons/' + lessons[8]['id'])
assert lesson['script'] and lesson['questions'] and lesson['content']['slides']
assigned = trainer.request('lessons/' + lesson['id'] + '/assign', {'cohortId': cohort['id'], 'deadline': '2026-12-31T12:00:00+05:00'})
assert assigned['id']
passed('11. Trainer can read teaching notes, presentation slides and assign the linked practical')
editable=manager.request('lessons/'+lessons[1]['id'])
sections={k:editable['content'][k] for k in ['dos','donts','precautions','example','assignment','evidence','checklist','rubric','slides']}
sections['dos']=sections['dos']+['Synthetic management content edit retained with its version.']
lesson_edit={'title':editable['title'],'objective':editable['objective'],'explanation':editable['content']['explanation'],'steps':editable['content']['steps'],'script':editable['script'],'video':None,'version':editable['version'],'sections':sections,'questions':editable['questions']+['Which facts still need independent verification?']}
trainer.request('lessons/'+editable['id'],lesson_edit,method='PUT',expected=403)
manager.request('lessons/'+editable['id'],{**lesson_edit,'sections':{**sections,'rubric':[{'label':'Invalid total','weight':99}]}},method='PUT',expected=422)
manager.request('lessons/'+editable['id'],lesson_edit,method='PUT')
updated=manager.request('lessons/'+editable['id'])
assert updated['version']==editable['version']+1 and sections['dos'][-1] in updated['content']['dos']
assert 'script' not in learner.request('lessons/'+editable['id'])
print('ADDITIONAL PASS: Full lesson sections, rubric and private teaching content are versioned and management-authorized.',flush=True)
manager.request('payments', {'studentId': student_id, 'amount': 20000, 'reference': 'Synthetic manual fee record ' + RUN, 'verified': False})
report = manager.request('bootstrap')
assert any(s['id'] == student_id and s['completed'] == 45 for s in report['students'])
assert any(p['student_id'] == student_id and not p['verified'] for p in report['payments'])
assert any(c['student_id'] == student_id for c in report['certificates'])
assert report['audit']
exported = learner.request('export')
assert b'Record ID' in exported and credentials['second']['id'].encode() not in exported
passed('12. Management reporting, manual fee status, certification and scoped CSV exports are accurate')

Path(os.environ.get('ACADEMY_TEST_DATA_DIR','.academy-data')).joinpath('acceptance-result.json').write_text(json.dumps({'run': RUN, 'passed': results, 'learner_id': student_id, 'research_id': day8_id}, indent=2))
print(json.dumps({'result': 'passed', 'demonstrations': len(results), 'forms': len(latest), 'approved_days': 45, 'skipped': 0}, indent=2))
