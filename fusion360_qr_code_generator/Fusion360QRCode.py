import adsk.core, adsk.fusion, adsk.cam, traceback
import os
import sys

# Add lib directory to sys.path
app_path = os.path.dirname(os.path.abspath(__file__))
lib_path = os.path.join(app_path, 'lib')
if lib_path not in sys.path:
    sys.path.insert(0, lib_path)

try:
    import qrcode
except ImportError:
    # This will be handled if the library isn't found, but we expect it to be bundled.
    pass

# Global list to keep track of event handlers to ensure they are not garbage collected.
handlers = []

def run(context):
    ui = None
    try:
        app = adsk.core.Application.get()
        ui  = app.userInterface

        # Create the command definition.
        cmdDefs = ui.commandDefinitions
        
        # Check if the command already exists to avoid errors on reload
        cmdDef = cmdDefs.itemById('Fusion360QRCodeCmd')
        if cmdDef:
            cmdDef.deleteMe()
            
        cmdDef = cmdDefs.addButtonDefinition('Fusion360QRCodeCmd', 
                                             'QR Code Generator', 
                                             'Generates a 3D printable QR code.',
                                             './resources')

        # Connect to the command created event.
        onCommandCreated = QRCodeCommandCreatedHandler()
        cmdDef.commandCreated.add(onCommandCreated)
        handlers.append(onCommandCreated)

        # Add the command to the CREATE panel in the Design workspace.
        workspaces = ui.workspaces
        designWorkspace = workspaces.itemById('FusionSolidEnvironment')
        if designWorkspace:
            panels = designWorkspace.toolbarPanels
            # Try to add to the "Create" panel (SolidCreatePanel) or "Make" panel if preferred.
            # Using "SolidCreatePanel" is standard for creation tools.
            createPanel = panels.itemById('SolidCreatePanel')
            if createPanel:
                createPanel.controls.addCommand(cmdDef)
            else:
                # Fallback if specific panel not found
                panels.item(0).controls.addCommand(cmdDef)

    except:
        if ui:
            ui.messageBox('Failed:\n{}'.format(traceback.format_exc()))

def stop(context):
    ui = None
    try:
        app = adsk.core.Application.get()
        ui  = app.userInterface
        
        # Clean up the UI.
        cmdDef = ui.commandDefinitions.itemById('Fusion360QRCodeCmd')
        if cmdDef:
            cmdDef.deleteMe()
            
        workspaces = ui.workspaces
        designWorkspace = workspaces.itemById('FusionSolidEnvironment')
        if designWorkspace:
            panels = designWorkspace.toolbarPanels
            createPanel = panels.itemById('SolidCreatePanel')
            if createPanel:
                cntrl = createPanel.controls.itemById('Fusion360QRCodeCmd')
                if cntrl:
                    cntrl.deleteMe()

    except:
        if ui:
            ui.messageBox('Failed:\n{}'.format(traceback.format_exc()))

class QRCodeCommandCreatedHandler(adsk.core.CommandCreatedEventHandler):
    def __init__(self):
        super().__init__()
    def notify(self, args):
        try:
            cmd = args.command
            inputs = cmd.commandInputs
            
            # 1. Text Input
            inputs.addStringValueInput('text_input', 'Text to Embed', 'https://example.com')
            
            # 2. QR Code Size (mm)
            # ValueInput.createByReal takes cm internally, but we want to show mm.
            # 2.5 cm = 25 mm
            initSize = adsk.core.ValueInput.createByReal(2.5) 
            inputs.addValueInput('size_input', 'QR Code Size', 'mm', initSize)
            
            # 3. QR Code Thickness (mm)
            # 0.1 cm = 1.0 mm
            initThickness = adsk.core.ValueInput.createByReal(0.1)
            inputs.addValueInput('thickness_input', 'QR Code Thickness', 'mm', initThickness)
            
            # 4. Base Checkbox
            inputs.addBoolValueInput('base_check', 'Create Base', True, '', True)
            
            # 5. Base Margin (mm)
            # 0.2 cm = 2.0 mm
            initMargin = adsk.core.ValueInput.createByReal(0.2)
            inputs.addValueInput('base_margin', 'Base Margin', 'mm', initMargin)
            
            # 6. Base Thickness (mm)
            # 0.2 cm = 2.0 mm
            initBaseThickness = adsk.core.ValueInput.createByReal(0.2)
            inputs.addValueInput('base_thickness', 'Base Thickness', 'mm', initBaseThickness)

            # Connect to the execute event.
            onExecute = QRCodeCommandExecuteHandler()
            cmd.execute.add(onExecute)
            handlers.append(onExecute)
            
        except:
            app = adsk.core.Application.get()
            ui = app.userInterface
            ui.messageBox('Failed:\n{}'.format(traceback.format_exc()))

class QRCodeCommandExecuteHandler(adsk.core.CommandEventHandler):
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

            # Get inputs
            rootComp = design.rootComponent
            inputs = args.command.commandInputs
            text = inputs.itemById('text_input').value
            
            # Fusion stores values in cm.
            size_cm = inputs.itemById('size_input').value
            thickness_cm = inputs.itemById('thickness_input').value
            
            create_base = inputs.itemById('base_check').value
            margin_cm = inputs.itemById('base_margin').value
            base_thickness_cm = inputs.itemById('base_thickness').value

            # Generate QR Code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=0, # We handle border/margin manually
            )
            qr.add_data(text)
            qr.make(fit=True)
            matrix = qr.get_matrix()
            
            # Matrix is a list of lists of booleans. True = Black (Block), False = White.
            # Coordinate system: (row, col). row 0 is top.
            
            rows = len(matrix)
            cols = len(matrix[0]) # Should be square
            
            # Calculate block size in cm
            # Total size = size_cm
            block_size_cm = size_cm / cols
            
            # To center the QR code at origin:
            # Top-Left corner is at (-size/2, size/2)
            start_x = -size_cm / 2.0
            start_y = size_cm / 2.0
            
            # Method 2: Direct BRep Generation (More Robust)
            # Instead of sketching, we create temporary BRep bodies for each block and union them.
            # This avoids profile ambiguity and is faster for complex grids.
            
            tBrep = adsk.fusion.TemporaryBRepManager.get()
            combined_body = None
            
            # Optimization: Run Length Encoding
            # Combine adjacent black modules in a row into a single rectangle
            
            # Helper to add a box to the combined body
            def add_box(cx, cy, width, height, thick):
                nonlocal combined_body
                center = adsk.core.Point3D.create(cx, cy, thick / 2.0) # Center Z is half thickness
                # OrientedBoundingBox3D.create(center, lengthDir, widthDir, length, width, height)
                # length = width (x), width = height (y), height = thick (z)
                bbox = adsk.core.OrientedBoundingBox3D.create(
                    center, 
                    adsk.core.Vector3D.create(1, 0, 0), 
                    adsk.core.Vector3D.create(0, 1, 0), 
                    width, 
                    height, 
                    thick
                )
                box = tBrep.createBox(bbox)
                if combined_body is None:
                    combined_body = box
                else:
                    tBrep.booleanOperation(combined_body, box, adsk.fusion.BooleanTypes.UnionBooleanType)

            for r in range(rows):
                c = 0
                while c < cols:
                    if matrix[r][c]:
                        # Start of a run
                        start_c = c
                        c += 1
                        while c < cols and matrix[r][c]:
                            c += 1
                        # End of run. Run is from start_c to c-1
                        run_length = c - start_c
                        
                        # Calculate geometry
                        # Top-Left of run
                        # x1 = start_x + (start_c * block_size)
                        # Center X = x1 + (total_width / 2)
                        
                        run_width_cm = run_length * block_size_cm
                        
                        # Center X
                        # x_start = start_x + (start_c * block_size_cm)
                        # cx = x_start + (run_width_cm / 2.0)
                        cx = start_x + (start_c * block_size_cm) + (run_width_cm / 2.0)
                        
                        # Center Y (Row r)
                        cy = start_y - (r * block_size_cm) - (block_size_cm / 2.0)
                        
                        add_box(cx, cy, run_width_cm, block_size_cm, thickness_cm)
                    else:
                        c += 1
            
            # Create Base if requested
            if create_base:
                base_width = size_cm + (margin_cm * 2)
                # Base is centered at 0,0. Z from 0 to -base_thickness
                # Center Z = -base_thickness / 2.0
                
                base_cx = 0
                base_cy = 0
                base_cz = -base_thickness_cm / 2.0
                
                base_center = adsk.core.Point3D.create(base_cx, base_cy, base_cz)
                base_bbox = adsk.core.OrientedBoundingBox3D.create(
                    base_center,
                    adsk.core.Vector3D.create(1, 0, 0),
                    adsk.core.Vector3D.create(0, 1, 0),
                    base_width,
                    base_width,
                    base_thickness_cm
                )
                base_box = tBrep.createBox(base_bbox)
                
                if combined_body is None:
                    combined_body = base_box
                else:
                    tBrep.booleanOperation(combined_body, base_box, adsk.fusion.BooleanTypes.UnionBooleanType)
            
            # Add the final body to the document
            if combined_body:
                if design.designType == adsk.fusion.DesignTypes.ParametricDesignType:
                    baseFeats = rootComp.features.baseFeatures
                    baseFeat = baseFeats.add()
                    baseFeat.startEdit()
                    rootComp.bRepBodies.add(combined_body, baseFeat)
                    baseFeat.finishEdit()
                else:
                    rootComp.bRepBodies.add(combined_body)
            else:
                ui.messageBox('Error: No geometry generated.')

        except:
            if ui:
                ui.messageBox('Failed:\n{}'.format(traceback.format_exc()))
