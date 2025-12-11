import adsk.core, adsk.fusion, adsk.cam, traceback
import os
import sys
import json

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
SETTINGS_FILE = os.path.join(app_path, 'settings.json')

def load_settings():
    try:
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, 'r') as f:
                return json.load(f)
    except:
        pass
    return {}

def save_settings(settings):
    try:
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(settings, f)
    except:
        pass

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
            
            # Load settings
            settings = load_settings()
            
            # Defaults
            default_text = settings.get('text_input', 'https://example.com')
            default_size = settings.get('size_input', 2.5) # cm
            default_thickness = settings.get('thickness_input', 0.1) # cm
            default_base_check = settings.get('base_check', True)
            default_base_margin = settings.get('base_margin', 0.2) # cm
            default_base_thickness = settings.get('base_thickness', 0.2) # cm
            default_fillet_check = settings.get('fillet_check', False)
            default_fillet_radius = settings.get('fillet_radius', 0.5) # cm (5mm)

            # 1. Text Input
            inputs.addStringValueInput('text_input', 'Text to Embed', default_text)
            
            # 2. QR Code Size (mm)
            initSize = adsk.core.ValueInput.createByReal(default_size) 
            inputs.addValueInput('size_input', 'QR Code Size', 'mm', initSize)
            
            # 3. QR Code Thickness (mm)
            initThickness = adsk.core.ValueInput.createByReal(default_thickness)
            inputs.addValueInput('thickness_input', 'QR Code Thickness', 'mm', initThickness)
            
            # 4. Base Checkbox
            inputs.addBoolValueInput('base_check', 'Create Base', True, '', default_base_check)
            
            # 5. Base Margin (mm)
            initMargin = adsk.core.ValueInput.createByReal(default_base_margin)
            inputs.addValueInput('base_margin', 'Base Margin', 'mm', initMargin)
            
            # 6. Base Thickness (mm)
            initBaseThickness = adsk.core.ValueInput.createByReal(default_base_thickness)
            inputs.addValueInput('base_thickness', 'Base Thickness', 'mm', initBaseThickness)

            # 7. Fillet Base Corners
            inputs.addBoolValueInput('fillet_check', 'Fillet Base Corners', True, '', default_fillet_check)

            # 8. Fillet Radius (mm)
            initFilletRadius = adsk.core.ValueInput.createByReal(default_fillet_radius)
            inputs.addValueInput('fillet_radius', 'Fillet Radius', 'mm', initFilletRadius)

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
            
            fillet_base = inputs.itemById('fillet_check').value
            fillet_radius_cm = inputs.itemById('fillet_radius').value

            # Save settings
            current_settings = {
                'text_input': text,
                'size_input': size_cm,
                'thickness_input': thickness_cm,
                'base_check': create_base,
                'base_margin': margin_cm,
                'base_thickness': base_thickness_cm,
                'fillet_check': fillet_base,
                'fillet_radius': fillet_radius_cm
            }
            save_settings(current_settings)

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
            
            # Method 3: Sequential Feature Creation (Robust Fillet)
            
            # 1. Create Base (if requested)
            base_body = None
            if create_base:
                base_width = size_cm + (margin_cm * 2)
                # Base is centered at 0,0. Z from 0 to -base_thickness
                base_cx = 0
                base_cy = 0
                base_cz = -base_thickness_cm / 2.0
                
                tBrep = adsk.fusion.TemporaryBRepManager.get()
                base_center = adsk.core.Point3D.create(base_cx, base_cy, base_cz)
                base_bbox = adsk.core.OrientedBoundingBox3D.create(
                    base_center,
                    adsk.core.Vector3D.create(1, 0, 0),
                    adsk.core.Vector3D.create(0, 1, 0),
                    base_width,
                    base_width,
                    base_thickness_cm
                )
                base_temp_body = tBrep.createBox(base_bbox)
                
                # Add base to document immediately
                if design.designType == adsk.fusion.DesignTypes.ParametricDesignType:
                    baseFeats = rootComp.features.baseFeatures
                    baseFeat = baseFeats.add()
                    baseFeat.startEdit()
                    base_body = rootComp.bRepBodies.add(base_temp_body, baseFeat)
                    baseFeat.finishEdit()
                    
                    # Robustly get from feature
                    if baseFeat.bodies.count > 0:
                        base_body = baseFeat.bodies.item(0)
                else:
                    base_body = rootComp.bRepBodies.add(base_temp_body)

                # 2. Apply Fillet to Base
                if fillet_base and base_body:
                    try:
                        # Validation: Check if radius is possible
                        min_dimension = base_width
                        if fillet_radius_cm > (min_dimension / 2.0 - 0.001):
                            ui.messageBox('Warning: Fillet Radius ({:.1f}mm) is too large for the current Base Size ({:.1f}mm). Radius must be less than half the width.'.format(fillet_radius_cm * 10, base_width * 10))
                        
                        edges = adsk.core.ObjectCollection.create()
                        tolerance = 0.01
                        
                        for edge in base_body.edges:
                            # Filter for vertical edges
                            # Since base_body is a simple box, all vertical edges are corner edges.
                            if edge.geometry.curveType != adsk.core.Curve3DTypes.Line3DCurveType:
                                continue
                            
                            p1 = edge.startVertex.geometry
                            p2 = edge.endVertex.geometry
                            
                            # Vertical check (X and Y constant, Z varies)
                            if abs(p1.x - p2.x) < tolerance and abs(p1.y - p2.y) < tolerance:
                                edges.add(edge)
                        
                        if edges.count > 0:
                            fillets = rootComp.features.filletFeatures
                            filletInput = fillets.createInput()
                            filletInput.addConstantRadiusEdgeSet(edges, adsk.core.ValueInput.createByReal(fillet_radius_cm), True)
                            fillets.add(filletInput)
                        else:
                            # If no vertical edges, maybe thickness is 0?
                            if base_thickness_cm <= 0.001:
                                ui.messageBox('Warning: Base Thickness is too small or zero. Cannot fillet a flat sheet.')
                            else:
                                ui.messageBox('Warning: Could not find vertical edges on the base to fillet.')
                                
                    except:
                        ui.messageBox('Warning: Failed to create fillet on base.\n{}'.format(traceback.format_exc()))

            # 3. Create QR Code Geometry
            tBrep = adsk.fusion.TemporaryBRepManager.get()
            qr_combined_body = None
            
            start_x = -size_cm / 2.0
            start_y = size_cm / 2.0
            block_size_cm = size_cm / cols
            
            # Helper to add a box to the combined body (Local to this block)
            def add_box(cx, cy, width, height, thick):
                nonlocal qr_combined_body
                center = adsk.core.Point3D.create(cx, cy, thick / 2.0)
                bbox = adsk.core.OrientedBoundingBox3D.create(
                    center, 
                    adsk.core.Vector3D.create(1, 0, 0), 
                    adsk.core.Vector3D.create(0, 1, 0), 
                    width, 
                    height, 
                    thick
                )
                box = tBrep.createBox(bbox)
                if qr_combined_body is None:
                    qr_combined_body = box
                else:
                    tBrep.booleanOperation(qr_combined_body, box, adsk.fusion.BooleanTypes.UnionBooleanType)

            for r in range(rows):
                c = 0
                while c < cols:
                    if matrix[r][c]:
                        start_c = c
                        c += 1
                        while c < cols and matrix[r][c]:
                            c += 1
                        run_length = c - start_c
                        run_width_cm = run_length * block_size_cm
                        cx = start_x + (start_c * block_size_cm) + (run_width_cm / 2.0)
                        cy = start_y - (r * block_size_cm) - (block_size_cm / 2.0)
                        add_box(cx, cy, run_width_cm, block_size_cm, thickness_cm)
                    else:
                        c += 1

            # Add QR Body to document
            qr_body = None
            if qr_combined_body:
                if design.designType == adsk.fusion.DesignTypes.ParametricDesignType:
                    baseFeats = rootComp.features.baseFeatures
                    baseFeat = baseFeats.add()
                    baseFeat.startEdit()
                    qr_body = rootComp.bRepBodies.add(qr_combined_body, baseFeat)
                    baseFeat.finishEdit()
                    if baseFeat.bodies.count > 0:
                        qr_body = baseFeat.bodies.item(0)
                else:
                    qr_body = rootComp.bRepBodies.add(qr_combined_body)
            else:
                 if not create_base:
                     ui.messageBox('Error: No geometry generated.')
                     return

            # 4. Combine Base and QR
            if base_body and qr_body:
                if design.designType == adsk.fusion.DesignTypes.ParametricDesignType:
                    combines = rootComp.features.combineFeatures
                    tools = adsk.core.ObjectCollection.create()
                    tools.add(qr_body)
                    input = combines.createInput(base_body, tools)
                    input.operation = adsk.fusion.FeatureOperations.JoinFeatureOperation
                    combines.add(input)
                else:
                    # Direct modeling combine
                    # Use BRep bodies combine if API supports distinct modify, or use Features
                    # In Direct mode, features are still often used for combine? 
                    # Actually, rootComp.features.combineFeatures works in Direct mode too usually,
                    # but createInput might need tweaks.
                    # Or use tBrep boolean if we hadn't added them yet... but we did add them.
                    # Let's try using the feature.
                    combines = rootComp.features.combineFeatures
                    tools = adsk.core.ObjectCollection.create()
                    tools.add(qr_body)
                    input = combines.createInput(base_body, tools)
                    input.operation = adsk.fusion.FeatureOperations.JoinFeatureOperation
                    combines.add(input)

        except:
            if ui:
                ui.messageBox('Failed:\n{}'.format(traceback.format_exc()))

