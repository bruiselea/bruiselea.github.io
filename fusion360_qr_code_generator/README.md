# Fusion 360 QR Code Generator

This is a Fusion 360 Add-in that generates 3D printable QR codes.

## Installation

1.  Download or clone this repository.
2.  Open Autodesk Fusion 360.
3.  Go to the **Utilities** tab (or **Tools** tab in older versions).
4.  Click **Scripts and Add-Ins**.
5.  Select the **Add-Ins** tab.
6.  Click the green **+** (Plus) icon next to "My Add-Ins".
7.  Navigate to the `fusion360_qr_code_generator` folder and click **Open**.
8.  The "QR Code Generator" add-in should now appear in the list. Select it and click **Run**.
9.  (Optional) Check "Run on Startup" to have it load automatically.

## Usage

1.  In the **Design** workspace, go to the **Create** panel.
2.  Click **QR Code Generator**.
3.  Enter the text you want to embed (e.g., a URL).
4.  Set the size and thickness.
5.  Optionally enable the base/pedestal.
6.  Click **OK**.

## Requirements

-   Fusion 360
-   Internet connection (for initial setup if not bundled, but this version has `qrcode` bundled).

## Troubleshooting

-   If the command doesn't appear, check the "Text Commands" palette in Fusion 360 for error messages.
-   Ensure the `lib` folder contains the `qrcode` library.
