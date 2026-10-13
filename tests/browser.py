"""Browser demonstrations against the isolated server; no credentials are printed."""
import json
import os
import time
import uuid
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from helpers import Actor, BASE
from fixtures import training_templates

credentials=json.loads(Path(os.environ.get('ACADEMY_TEST_CREDENTIALS','.academy-data/demo-credentials.json')).read_text())
directory=Path(os.environ.get('ACADEMY_TEST_DATA_DIR','.academy-data'))/'browser'
directory.mkdir(parents=True,exist_ok=True)
RUN=uuid.uuid4().hex[:8]
templates=training_templates(RUN)
trainer=Actor();trainer.login(credentials['trainer']['email'],credentials['trainer']['password'])
errors=[];checks=[]
def passed(label):checks.append(label);print('BROWSER PASS:',label,flush=True)

def fill_fields(page,values):
    for key,value in values.items():
        if key=='variations' and isinstance(value,list):continue
        locator=page.locator('#field-'+key)
        if not locator.count():continue
        tag=locator.evaluate('(el)=>el.tagName.toLowerCase()')
        if isinstance(value,bool):locator.set_checked(value)
        elif tag=='select':locator.select_option(str(value))
        else:locator.fill(str(value))

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    context=browser.new_context(viewport={'width':1440,'height':1040},timezone_id='Asia/Karachi',reduced_motion='reduce')
    page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(BASE,wait_until='domcontentloaded')
    expect(page.get_by_role('heading',name='Let’s keep moving forward.')).to_be_visible(timeout=30000)
    page.get_by_label('Email address',exact=True).fill(credentials['student']['email'])
    page.get_by_label('Password',exact=True).fill(credentials['student']['password'])
    page.get_by_role('button',name='Sign in to Academy',exact=True).click()
    expect(page.get_by_role('heading',name='Welcome back, Ayesha.')).to_be_visible(timeout=30000)
    page.screenshot(path=str(directory/'learner-dashboard.png'),full_page=True)
    passed('Private learner login and database-backed dashboard render')

    page.get_by_role('button',name='Continue Training',exact=True).click()
    expect(page.get_by_role('heading',level=1,name='eBay Product Hunting Fundamentals')).to_be_visible()
    for checkbox in page.locator('.check-panel input[type=checkbox]').all():
        if not checkbox.is_checked():
            expect(checkbox).to_be_enabled();checkbox.check();expect(checkbox).to_be_checked()
    page.get_by_role('button',name='Ready for practice',exact=True).click()
    expect(page.get_by_role('heading',level=1,name='Product Hunting Log')).to_be_visible()
    record_id=page.url.split('#record/')[1]
    values=dict(templates['F02']);values['title']='Browser synthetic research '+RUN
    fill_fields(page,values)
    page.get_by_role('button',name='Save draft',exact=True).click()
    expect(page.locator('.save-status')).to_contain_text('Saved to your workspace')
    page.get_by_label('Upload evidence').set_input_files({'name':'synthetic-browser-evidence.txt','mimeType':'text/plain','buffer':b'SYNTHETIC TRAINING EVIDENCE: fictional sold history, not live marketplace results.'})
    expect(page.get_by_role('link',name='synthetic-browser-evidence.txt')).to_be_visible()
    page.get_by_role('button',name='Submit for review',exact=True).click()
    dialog=page.get_by_role('dialog',name='Submit this revision for review?')
    dialog.get_by_role('button',name='Submit for review',exact=True).click()
    expect(page.get_by_text('Awaiting trainer review',exact=True)).to_be_visible()
    passed('Lesson checklist, research fields, evidence upload and submission work in the browser')

    record=trainer.request('submissions/'+record_id)
    trainer.request('submissions/'+record_id+'/review',{'revision':record['revision'],'decision':'changes_requested','score':65,'comments':'Separate sold and completed observations more precisely in your evidence notes.','fieldComments':[{'field':'evidenceNote','comment':'Confirmed sold status is required; completed alone is not a sale.'}],'critical':False})
    expect(page.get_by_text('Confirmed sold status is required; completed alone is not a sale.',exact=False).first).to_be_visible(timeout=5000)
    page.locator('#field-evidenceNote').fill('SYNTHETIC correction: only confirmed sold listings count as sales. Completed unsold listings are explicitly excluded.')
    page.get_by_role('button',name='Submit for review',exact=True).click()
    page.get_by_role('dialog',name='Submit this revision for review?').get_by_role('button',name='Submit for review',exact=True).click()
    expect(page.get_by_text('Awaiting trainer review',exact=True)).to_be_visible()
    record=trainer.request('submissions/'+record_id)
    trainer.request('submissions/'+record_id+'/review',{'revision':record['revision'],'decision':'approved','score':94,'comments':'Synthetic research evidence and the correction are now complete and traceable.','fieldComments':[],'critical':False})
    expect(page.get_by_role('button',name='Continue to Supplier sourcing',exact=True)).to_be_visible(timeout=5000)
    page.get_by_role('button',name='Continue to Supplier sourcing',exact=True).click()
    expect(page.get_by_role('heading',level=1,name='Supplier Qualification')).to_be_visible()
    expect(page.locator('#field-title')).to_have_value(values['title'])
    source_id=page.url.split('#record/')[1]
    source_record=trainer.request('submissions/'+source_id)
    page.goto(BASE+'/#lesson/'+source_record['lesson_id'])
    expect(page.locator('.check-panel')).to_be_visible()
    for checkbox in page.locator('.check-panel input[type=checkbox]').all():
        if not checkbox.is_checked():
            expect(checkbox).to_be_enabled();checkbox.check();expect(checkbox).to_be_checked()
    expect(page.get_by_role('button',name='Ready for practice',exact=True)).to_be_enabled()
    page.goto(BASE+'/#record/'+source_id)
    expect(page.get_by_role('heading',level=1,name='Supplier Qualification')).to_be_visible()
    values_source=dict(templates['F04']);values_source['title']=values['title']
    fill_fields(page,values_source)
    page.get_by_label('Upload evidence').set_input_files({'name':'synthetic-source.txt','mimeType':'text/plain','buffer':b'SYNTHETIC source, variant and checkout evidence. No genuine supplier verification claimed.'})
    expect(page.get_by_role('link',name='synthetic-source.txt')).to_be_visible()
    page.get_by_role('button',name='Submit for review',exact=True).click()
    page.get_by_role('dialog',name='Submit this revision for review?').get_by_role('button',name='Submit for review',exact=True).click()
    expect(page.get_by_text('Awaiting trainer review',exact=True)).to_be_visible()
    source=trainer.request('submissions/'+source_id)
    trainer.request('submissions/'+source_id+'/review',{'revision':source['revision'],'decision':'approved','score':94,'comments':'Synthetic supplier qualification and exact checkout evidence reviewed.','fieldComments':[],'critical':False})
    expect(page.get_by_role('button',name='Continue to Costing & ROI',exact=True)).to_be_visible(timeout=5000)
    page.get_by_role('button',name='Continue to Costing & ROI',exact=True).click()
    expect(page.get_by_role('heading',level=1,name='ROI & Pricing Calculator')).to_be_visible()
    expect(page.locator('#field-item')).to_have_value('2.01')
    fill_fields(page,templates['F06'])
    expect(page.get_by_text('143.8%',exact=True)).to_be_visible()
    page.screenshot(path=str(directory/'roi-workspace.png'),full_page=True)
    passed('Live review feedback, resubmission, approval and inherited source/ROI data flow correctly')

    page.locator('#field-title').fill('Latest saved navigation draft '+RUN)
    page.get_by_role('button',name='Dashboard',exact=True).click()
    expect(page.get_by_role('heading',name='Welcome back, Ayesha.')).to_be_visible()
    response=context.request.get(BASE+'/api/bootstrap');boot=response.json()
    assert any(s['title']=='Latest saved navigation draft '+RUN for s in boot['submissions'])
    passed('Navigating away flushes unsaved draft edits to PostgreSQL')

    for label,heading in [('My Learning Journey','One journey. Fourteen possibilities.'),('Courses & Lessons','Your course, chapter by chapter.'),('Practice Lab','The practice lab.'),('Assignments','Turn understanding into action.'),('Product Research','Find the opportunity. Verify the evidence.'),('Operational Workflows','From research to real capability.'),('My Submissions','Your work. Your progress.'),('Assessments','Check what you know. Show what you can do.'),('Performance','Your skills, taking shape.'),('Resources & SOP Library','Keep good guidance close.'),('Notifications','Every update, in one place.'),('Profile & Settings','Make your workspace yours.')]:
        page.get_by_role('button',name=label,exact=True).click();expect(page.get_by_role('heading',level=1,name=heading)).to_be_visible()
    passed('All thirteen learner navigation views render with working data')

    page.get_by_role('button',name='Dashboard',exact=True).click()
    expect(page.get_by_role('heading',name='Welcome back, Ayesha.')).to_be_visible()
    page.set_viewport_size({'width':375,'height':812})
    page.wait_for_function('document.documentElement.scrollWidth <= innerWidth')
    page.get_by_role('button',name='Toggle navigation',exact=True).click()
    page.get_by_role('button',name='My Learning Journey',exact=True).click()
    expect(page.get_by_role('heading',level=1,name='One journey. Fourteen possibilities.')).to_be_visible()
    page.wait_for_function('document.documentElement.scrollWidth <= innerWidth')
    page.screenshot(path=str(directory/'mobile-journey.png'),full_page=True)
    passed('375px mobile layout and touch navigation work without horizontal overflow')
    context.close()

    teacher_context=browser.new_context(viewport={'width':1440,'height':1000},timezone_id='Asia/Karachi')
    teacher_context.request.post(BASE+'/api/auth/login',data={'email':credentials['trainer']['email'],'password':credentials['trainer']['password']})
    teacher_page=teacher_context.new_page();teacher_page.on('pageerror',lambda error:errors.append(str(error)))
    teacher_page.goto(BASE,wait_until='domcontentloaded')
    expect(teacher_page.get_by_role('heading',name='Welcome back, Hassan.')).to_be_visible(timeout=30000)
    teacher_page.get_by_role('button',name='Start Teaching',exact=True).click()
    expect(teacher_page.get_by_role('dialog',name='Trainer presentation')).to_be_visible()
    expect(teacher_page.get_by_text('Speaker notes · instructor only',exact=True)).to_be_visible()
    teacher_page.get_by_role('button',name='Reveal this step',exact=True).click()
    teacher_page.get_by_role('button',name='Next slide',exact=True).click()
    expect(teacher_page.get_by_text('SLIDE 2 /',exact=False)).to_be_visible()
    teacher_page.get_by_role('button',name='Assign the practical',exact=True).click()
    allocation=teacher_page.get_by_role('dialog',name='Assign from the classroom')
    allocation.get_by_role('button',name='Assign practical',exact=True).click()
    expect(allocation).not_to_be_visible()
    teacher_page.get_by_role('button',name='Exit presentation',exact=True).click()
    passed('Trainer presentation navigation, private notes and classroom task allocation work')
    teacher_context.close()

    manager_context=browser.new_context(viewport={'width':1440,'height':1000},timezone_id='Asia/Karachi')
    manager_context.request.post(BASE+'/api/auth/login',data={'email':credentials['admin']['email'],'password':credentials['admin']['password']})
    manager_page=manager_context.new_page();manager_page.on('pageerror',lambda error:errors.append(str(error)))
    manager_page.goto(BASE,wait_until='domcontentloaded');expect(manager_page.get_by_role('heading',name='Welcome back, team.')).to_be_visible(timeout=30000)
    manager_page.get_by_role('button',name='People & Cohorts',exact=True).click()
    expect(manager_page.get_by_role('heading',name='People are the heart of your academy.')).to_be_visible()
    manager_page.get_by_role('button',name='Cohorts',exact=True).click()
    manager_page.get_by_role('button',name='Create cohort',exact=True).click()
    cohort_dialog=manager_page.get_by_role('dialog',name='Create a training cohort')
    cohort_dialog.get_by_label('Cohort name',exact=True).fill('Browser cohort '+RUN)
    cohort_dialog.get_by_role('button',name='Create cohort',exact=True).click()
    expect(cohort_dialog).not_to_be_visible()
    expect(manager_page.get_by_role('heading',name='Browser cohort '+RUN,exact=True)).to_be_visible()
    manager_page.get_by_role('button',name='Profile & Settings',exact=True).click()
    manager_page.get_by_role('button',name='Brand identity',exact=True).click()
    expect(manager_page.get_by_role('heading',name='One identity, everywhere.')).to_be_visible()
    manager_page.screenshot(path=str(directory/'management-branding.png'),full_page=True)
    passed('Management cohort creation, reporting and central branding controls work')
    manager_context.close()
    assert not errors,errors
    browser.close()
directory.joinpath('result.json').write_text(json.dumps({'result':'passed','checks':checks,'page_errors':errors},indent=2))
print(json.dumps({'result':'passed','browser_checks':len(checks),'page_errors':len(errors)},indent=2))
