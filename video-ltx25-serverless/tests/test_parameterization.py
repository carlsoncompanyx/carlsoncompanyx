from workflow import build_workflow, validate_workflow_values
def test_t2v_parameterization():
 e={"action":"text_to_video","prompt":"t2v","duration":8,"width":704,"height":1280,"fps":24,"seed":123,"generate_audio":True};validate_workflow_values(build_workflow(**e),e)
def test_i2v_parameterization():
 e={"action":"image_to_video","prompt":"i2v","duration":8,"width":704,"height":1280,"fps":24,"seed":124,"generate_audio":True,"first_image":"portrait.png"};validate_workflow_values(build_workflow(image_filenames={"first_image":"portrait.png"},**e),e)
def test_flf_parameterization():
 e={"action":"first_last_frame_to_video","prompt":"flf","duration":8,"width":704,"height":1280,"fps":24,"seed":125,"generate_audio":True,"first_image":"first.png","last_image":"last.png"};validate_workflow_values(build_workflow(image_filenames={"first_image":"first.png","last_image":"last.png"},**e),e)
