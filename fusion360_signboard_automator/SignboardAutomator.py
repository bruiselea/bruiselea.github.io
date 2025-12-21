import adsk.core, adsk.fusion, adsk.cam, traceback
import os
import sys
import math

# Add lib directory to sys.path
app_path = os.path.dirname(os.path.abspath(__file__))
lib_path = os.path.join(app_path, 'lib')
if lib_path not in sys.path:
    sys.path.insert(0, lib_path)

try:
    import qrcode
except ImportError:
    pass

handlers = []

def run(context):
    ui = None
    try:
        app = adsk.core.Application.get()
        ui  = app.userInterface

        cmdDefs = ui.commandDefinitions
        cmdDef = cmdDefs.itemById('SignboardAutomatorCmd')
        if cmdDef:
            cmdDef.deleteMe()
            
        cmdDef = cmdDefs.addButtonDefinition('SignboardAutomatorCmd', 
                                             'Create Signboard', 
                                             'Generates a parametric signboard with QR code and Instagram icon.',
                                             './resources')

        onCommandCreated = SignboardCommandCreatedHandler()
        cmdDef.commandCreated.add(onCommandCreated)
        handlers.append(onCommandCreated)

        # Add to Create panel
        workspaces = ui.workspaces
        designWorkspace = workspaces.itemById('FusionSolidEnvironment')
        if designWorkspace:
            panels = designWorkspace.toolbarPanels
            createPanel = panels.itemById('SolidCreatePanel')
            if createPanel:
                createPanel.controls.addCommand(cmdDef)
            else:
                panels.item(0).controls.addCommand(cmdDef)

    except:
        if ui:
            ui.messageBox('Failed:\n{}'.format(traceback.format_exc()))

def stop(context):
    ui = None
    try:
        app = adsk.core.Application.get()
        ui  = app.userInterface
        
        cmdDef = ui.commandDefinitions.itemById('SignboardAutomatorCmd')
        if cmdDef:
            cmdDef.deleteMe()
            
        workspaces = ui.workspaces
        designWorkspace = workspaces.itemById('FusionSolidEnvironment')
        if designWorkspace:
            panels = designWorkspace.toolbarPanels
            createPanel = panels.itemById('SolidCreatePanel')
            if createPanel:
                cntrl = createPanel.controls.itemById('SignboardAutomatorCmd')
                if cntrl:
                    cntrl.deleteMe()
    except:
        if ui:
            ui.messageBox('Failed:\n{}'.format(traceback.format_exc()))

class SignboardCommandCreatedHandler(adsk.core.CommandCreatedEventHandler):
    def __init__(self):
        super().__init__()
    def notify(self, args):
        try:
            cmd = args.command
            inputs = cmd.commandInputs
            
            # Board Parameters
            inputs.addStringValueInput('board_group', 'Board Configuration', '')
            inputs.addValueInput('board_width', 'Board Width', 'mm', adsk.core.ValueInput.createByReal(10.0)) # 10cm = 100mm
            inputs.addValueInput('board_height', 'Board Height', 'mm', adsk.core.ValueInput.createByReal(15.0)) # 15cm = 150mm
            inputs.addValueInput('board_thickness', 'Board Thickness', 'mm', adsk.core.ValueInput.createByReal(0.5))
            inputs.addValueInput('corner_radius', 'Corner Radius', 'mm', adsk.core.ValueInput.createByReal(1.0))
            
            # QR Code Parameters
            inputs.addStringValueInput('qr_group', 'QR Code Configuration', '')
            inputs.addStringValueInput('qr_text', 'QR Content', 'https://instagram.com/example')
            inputs.addValueInput('qr_size', 'QR Size', 'mm', adsk.core.ValueInput.createByReal(3.0))
            inputs.addValueInput('qr_pos_x', 'QR Position X', 'mm', adsk.core.ValueInput.createByReal(0.0))
            inputs.addValueInput('qr_pos_y', 'QR Position Y', 'mm', adsk.core.ValueInput.createByReal(4.0))
            
            # Instagram Icon Parameters
            inputs.addStringValueInput('insta_group', 'Instagram Icon Configuration', '')
            inputs.addBoolValueInput('create_insta', 'Add Insta Icon', True)
            inputs.addValueInput('insta_size', 'Icon Size', 'mm', adsk.core.ValueInput.createByReal(2.0))
            inputs.addValueInput('insta_pos_x', 'Icon Position X', 'mm', adsk.core.ValueInput.createByReal(0.0))
            inputs.addValueInput('insta_pos_y', 'Icon Position Y', 'mm', adsk.core.ValueInput.createByReal(-4.0))

            onExecute = SignboardCommandExecuteHandler()
            cmd.execute.add(onExecute)
            handlers.append(onExecute)
        except:
            app = adsk.core.Application.get()
            ui = app.userInterface
            ui.messageBox('Failed:\n{}'.format(traceback.format_exc()))

class SignboardCommandExecuteHandler(adsk.core.CommandEventHandler):
    def __init__(self):
        super().__init__()
    def notify(self, args):
        try:
            app = adsk.core.Application.get()
            ui  = app.userInterface
            design = app.activeProduct
            if not design:
                ui.messageBox('No active design', 'Error')
                return

            inputs = args.command.commandInputs
            
            # Get Input Values
            b_width = inputs.itemById('board_width').value
            b_height = inputs.itemById('board_height').value
            b_thick = inputs.itemById('board_thickness').value
            b_rad = inputs.itemById('corner_radius').value
            
            qr_text = inputs.itemById('qr_text').value
            qr_size = inputs.itemById('qr_size').value
            qr_x = inputs.itemById('qr_pos_x').value
            qr_y = inputs.itemById('qr_pos_y').value
            
            create_insta = inputs.itemById('create_insta').value
            insta_size = inputs.itemById('insta_size').value
            insta_x = inputs.itemById('insta_pos_x').value
            insta_y = inputs.itemById('insta_pos_y').value

            rootComp = design.rootComponent
            
            # 1. Create User Parameters (so it is parametric)
            userParams = design.userParameters
            def set_param(name, value, unit, comment):
                p = userParams.itemByName(name)
                if p:
                    p.value = value
                else:
                    userParams.add(name, adsk.core.ValueInput.createByReal(value), unit, comment)
                    
            set_param('BoardWidth', b_width, 'cm', 'Width of the signboard')
            set_param('BoardHeight', b_height, 'cm', 'Height of the signboard')
            set_param('BoardThickness', b_thick, 'cm', 'Thickness of the signboard')
            set_param('CornerRadius', b_rad, 'cm', 'Radius of corners')

            # 2. Create Signboard Component
            occ = rootComp.occurrences.addNewComponent(adsk.core.Matrix3D.create())
            boardComp = occ.component
            boardComp.name = "Signboard"
            
            # Create Sketch for Board
            sketches = boardComp.sketches
            xyPlane = boardComp.xYConstructionPlane
            sketch = sketches.add(xyPlane)
            
            # Draw Center Rectangle (Lines)
            # We want to constrain this to parameters.
            # Center Point Rectangle
            lines = sketch.sketchCurves.sketchLines
            center = adsk.core.Point3D.create(0, 0, 0)
            corner = adsk.core.Point3D.create(b_width/2, b_height/2, 0) # Initial geometry
            # There is no direct "addCenterPointRectangle" that returns lines with constraints in API.
            # We use addTwoPointRectangle and constrain it.
            
            # Rectangle points
            p1 = adsk.core.Point3D.create(-b_width/2, -b_height/2, 0)
            p2 = adsk.core.Point3D.create(b_width/2, b_height/2, 0)
            rect_lines = lines.addTwoPointRectangle(p1, p2)
            
            # Add dimensions/constraints
            # Center constraint?
            # Fix center point?
            # Easier: Add Symmetry constraint to construction lines.
            
            # For simplicity in this script, we will just Dimension the Width and Height lines.
            # Line 0 is Bottom, Line 1 is Right, Line 2 is Top, Line 3 is Left (usually).
            # Let's verify orientations or just dimension horizontal and vertical.
            
            sketch.isComputeDeferred = True
            
            # Constraint: Midpoint of diagonals to origin? 
            # Or just fix the rectangle center.
            # Let's find the lines.
            # addTwoPointRectangle returns 4 lines.
            
            # Add Horizontal/Vertical constraints are automatic usually.
            
            # Add Dimensions linked to Parameters
            # We need to find a horizontal line and a vertical line.
            
            # Let's assume lines[0] is one and lines[1] is the other.
            
            # Creating dimensions
            dims = sketch.sketchDimensions
            
            # Width Dimension
            # We need a text point for the dimension
            textPt = adsk.core.Point3D.create(0, b_height/2 + 1, 0)
            
            # Find a horizontal line
            horiz_line = None
            vert_line = None
            
            for l in rect_lines:
                p_start = l.startSketchPoint.geometry
                p_end = l.endSketchPoint.geometry
                if abs(p_start.x - p_end.x) > 0.001 and abs(p_start.y - p_end.y) < 0.001:
                    horiz_line = l
                elif abs(p_start.y - p_end.y) > 0.001 and abs(p_start.x - p_end.x) < 0.001:
                    vert_line = l
            
            if horiz_line:
                dimW = dims.addDistanceDimension(horiz_line.startSketchPoint, horiz_line.endSketchPoint, 
                                                 adsk.fusion.DimensionOrientations.HorizontalDimensionOrientation, 
                                                 textPt)
                dimW.parameter.expression = 'BoardWidth'
                
            if vert_line:
                textPt2 = adsk.core.Point3D.create(b_width/2 + 1, 0, 0)
                dimH = dims.addDistanceDimension(vert_line.startSketchPoint, vert_line.endSketchPoint,
                                                 adsk.fusion.DimensionOrientations.VerticalDimensionOrientation,
                                                 textPt2)
                dimH.parameter.expression = 'BoardHeight'
                
            # Center the rectangle
            # Constrain midpoint of diagonal to origin?
            # Or Symmetry around origin axes.
            
            # Let's add construction lines for X and Y axes and symmetry.
            # Alternatively, just midpoint constraint of a diagonal to origin.
            # Draw diagonal
            diag = lines.addByTwoPoints(rect_lines.item(0).startSketchPoint, rect_lines.item(2).startSketchPoint)
            diag.isConstruction = True
            
            # Origin point
            originPt = sketch.originPoint
            
            # Midpoint constraint
            sketch.geometricConstraints.addMidPoint(originPt, diag)
            
            sketch.isComputeDeferred = False
            
            # Extrude Board
            profs = sketch.profiles
            prof = profs.item(0)
            extrudes = boardComp.features.extrudeFeatures
            extInput = extrudes.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
            # Use param name
            dist = adsk.core.ValueInput.createByString('BoardThickness')
            extInput.setDistanceExtent(False, dist)
            extBoard = extrudes.add(extInput)
            
            # Fillet Corners
            # Get edges of the extrusion.
            # We want the 4 vertical edges.
            # Filter edges that are vertical/parallel to Z?
            body = extBoard.bodies.item(0)
            edges = adsk.core.ObjectCollection.create()
            for edge in body.edges:
                # Check if parallel to Z
                # Get start and end
                p_s = edge.startVertex.geometry
                p_e = edge.endVertex.geometry
                if abs(p_s.x - p_e.x) < 0.001 and abs(p_s.y - p_e.y) < 0.001:
                    # Vertical edge
                    edges.add(edge)
            
            fillets = boardComp.features.filletFeatures
            filletInput = fillets.createInput()
            filletInput.addConstantRadiusEdgeSet(edges, adsk.core.ValueInput.createByString('CornerRadius'), True)
            fillets.add(filletInput)
            
            # 3. Create QR Code
            # Create a new component for QR (child of Root? or Child of Signboard? Keep independent for now)
            qrOcc = rootComp.occurrences.addNewComponent(adsk.core.Matrix3D.create())
            qrComp = qrOcc.component
            qrComp.name = "QR_Code"
            
            # Transformation to place it
            # Move qrOcc
            transform = adsk.core.Matrix3D.create()
            transform.translation = adsk.core.Vector3D.create(qr_x, qr_y, b_thick) # Place on top of board
            qrOcc.transform = transform
            
            generate_qr_brep(qrComp, qr_text, qr_size, 0.1) # 1mm thick QR
            
            # 4. Create Instagram Icon
            if create_insta:
                instaOcc = rootComp.occurrences.addNewComponent(adsk.core.Matrix3D.create())
                instaComp = instaOcc.component
                instaComp.name = "Instagram_Icon"
                
                # Transform
                transformI = adsk.core.Matrix3D.create()
                transformI.translation = adsk.core.Vector3D.create(insta_x, insta_y, b_thick)
                instaOcc.transform = transformI
                
                generate_insta_icon(instaComp, insta_size, 0.1)
                
        except:
            if ui:
                ui.messageBox('Failed:\n{}'.format(traceback.format_exc()))

def generate_qr_brep(comp, text, size_cm, thick_cm):
    # Reuse logic from previous project
    import qrcode
    qr = qrcode.QRCode(version=1, box_size=10, border=0)
    qr.add_data(text)
    qr.make(fit=True)
    matrix = qr.get_matrix()
    
    rows = len(matrix)
    cols = len(matrix[0])
    block_size = size_cm / cols
    
    start_x = -size_cm / 2.0
    start_y = size_cm / 2.0
    
    tBrep = adsk.fusion.TemporaryBRepManager.get()
    combined_body = None
    
    # Combined body logic
    # ...
    # Simplified loop for brevity, using the previous run-length logic
    
    for r in range(rows):
        c = 0
        while c < cols:
            if matrix[r][c]:
                start_c = c
                c += 1
                while c < cols and matrix[r][c]:
                    c += 1
                run_length = c - start_c
                
                run_width = run_length * block_size
                cx = start_x + (start_c * block_size) + (run_width / 2.0)
                cy = start_y - (r * block_size) - (block_size / 2.0)
                
                center = adsk.core.Point3D.create(cx, cy, thick_cm / 2.0)
                bbox = adsk.core.OrientedBoundingBox3D.create(
                    center, 
                    adsk.core.Vector3D.create(1, 0, 0), 
                    adsk.core.Vector3D.create(0, 1, 0), 
                    run_width, 
                    block_size, 
                    thick_cm
                )
                box = tBrep.createBox(bbox)
                if combined_body is None:
                    combined_body = box
                else:
                    tBrep.booleanOperation(combined_body, box, adsk.fusion.BooleanTypes.UnionBooleanType)
            else:
                c += 1
                
    if combined_body:
        comp.bRepBodies.add(combined_body)

def generate_insta_icon(comp, size_cm, thick_cm):
    # Sketch based generation for icon
    sketches = comp.sketches
    xyPlane = comp.xYConstructionPlane
    sketch = sketches.add(xyPlane)
    
    # Outer Rounded Square
    # Size is size_cm x size_cm
    # Center Rectangle
    lines = sketch.sketchCurves.sketchLines
    p1 = adsk.core.Point3D.create(-size_cm/2, -size_cm/2, 0)
    p2 = adsk.core.Point3D.create(size_cm/2, size_cm/2, 0)
    rect = lines.addTwoPointRectangle(p1, p2)
    
    # Fillet lines in sketch? Or Fillet Extrusion?
    # Sketch Fillet is good.
    # We need the 4 corner points.
    # sketch.sketchCurves.sketchArcs.addFillet(line1, pt1, line2, pt2, radius)
    # This is tedious in API.
    # Easier: Extrude Square -> Fillet Body -> Extrude Cut Circle -> Extrude Cut Dot.
    
    # Let's do Body operations for simplicity and robustness.
    
    # 1. Extrude Base
    profs = sketch.profiles
    extrudes = comp.features.extrudeFeatures
    extInput = extrudes.createInput(profs.item(0), adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    dist = adsk.core.ValueInput.createByReal(thick_cm)
    extInput.setDistanceExtent(False, dist)
    extBase = extrudes.add(extInput)
    
    # 2. Fillet Corners (approx 25% of size)
    body = extBase.bodies.item(0)
    edges = adsk.core.ObjectCollection.create()
    for e in body.edges:
        # Vertical edges
        p_s = e.startVertex.geometry
        p_e = e.endVertex.geometry
        if abs(p_s.x - p_e.x) < 0.001 and abs(p_s.y - p_e.y) < 0.001:
             edges.add(e)
             
    fillets = comp.features.filletFeatures
    fInput = fillets.createInput()
    rad = adsk.core.ValueInput.createByReal(size_cm * 0.25)
    fInput.addConstantRadiusEdgeSet(edges, rad, True)
    fillets.add(fInput)
    
    # 3. Cut Center Circle
    sketch2 = sketches.add(comp.xYConstructionPlane) # New sketch on bottom or top?
    # We want to cut through.
    circles = sketch2.sketchCurves.sketchCircles
    # Center circle (approx 50% of size)
    circles.addByCenterRadius(adsk.core.Point3D.create(0,0,0), size_cm * 0.25) # Radius, so 0.5 dia
    
    # Dot Circle (Top Right)
    # Pos approx (size*0.35, size*0.35)
    dot_pos = adsk.core.Point3D.create(size_cm * 0.35, size_cm * 0.35, 0)
    circles.addByCenterRadius(dot_pos, size_cm * 0.05)
    
    # Extrude Cut
    profs2 = sketch2.profiles
    # We have 2 profiles (Circle and Dot)
    coll = adsk.core.ObjectCollection.create()
    for i in range(profs2.count):
        coll.add(profs2.item(i))
        
    extInputCut = extrudes.createInput(coll, adsk.fusion.FeatureOperations.CutFeatureOperation)
    distCut = adsk.core.ValueInput.createByReal(thick_cm)
    extInputCut.setDistanceExtent(False, distCut)
    extrudes.add(extInputCut)

