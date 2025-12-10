# Signboard Automator for Fusion 360

Fusion 360 add-in for automating the creation of parametric signboards. This tool is designed to help signboard makers quickly model boards based on client specifications, including QR codes and Instagram icons.

## Features

- **Parametric Design**: Automatically generates a board where dimensions (width, height, thickness, corner radius) are controlled by Fusion 360 User Parameters.
- **QR Code Integration**: Generates a 3D printable QR code based on text input (e.g., website URL). The size and position are fully adjustable.
- **Instagram Icon**: Optionally adds a parametric Instagram icon with adjustable size and position.
- **User Interface**: Simple command dialog to input all settings at once.

## Installation

1. Download or clone this repository to your computer.
2. Open Autodesk Fusion 360.
3. Access the **Scripts and Add-Ins** dialog (shortcut: `Shift + S`).
4. Select the **Add-Ins** tab.
5. Click the green plus icon (**+**) next to "My Add-Ins".
6. Navigate to and select the `fusion360_signboard_automator` folder.
7. Click **Run**.

## Usage

1. In the **Design** workspace, go to the **SOLID** tab.
2. Under the **CREATE** panel, click **Create Signboard**.
3. A dialog will appear with the following options:
    - **Board Configuration**: Set the width, height, thickness, and corner radius of the main board.
    - **QR Code Configuration**: Enter the text/URL, and set the size and XY coordinates for the QR code.
    - **Instagram Icon Configuration**: Toggle the icon on/off, and set its size and XY coordinates.
4. Click **OK**.
5. The add-in will generate:
    - A `Signboard` component with the specified dimensions.
    - A `QR_Code` component placed on the board.
    - An `Instagram_Icon` component (if selected) placed on the board.
6. You can further adjust the board dimensions later by modifying the **User Parameters** (Modify > Change Parameters).

## Dependencies

- The add-in includes a bundled `qrcode` library in the `lib` folder. No external Python installation is required.

## License

MIT

---

# Signboard Automator for Fusion 360 (日本語)

看板作成を自動化するFusion 360アドインです。看板製作者がクライアントの仕様（サイズ、QRコード、Instagramアイコンなど）に基づいて素早くモデリングできるように設計されています。

## 特徴

- **パラメトリックデザイン**: 幅、高さ、厚さ、角丸の半径などの寸法がFusion 360のユーザーパラメータで制御される看板を自動生成します。
- **QRコード統合**: 入力されたテキスト（WebサイトのURLなど）に基づいて、3Dプリント可能なQRコードを生成します。サイズと位置は自由に調整可能です。
- **Instagramアイコン**: パラメトリックなInstagramアイコンをオプションで追加できます。サイズと位置も調整可能です。
- **ユーザーインターフェース**: すべての設定を一度に入力できるシンプルなコマンドダイアログを提供します。

## インストール方法

1. このリポジトリをダウンロードまたはクローンします。
2. Autodesk Fusion 360を開きます。
3. **スクリプトとアドイン** ダイアログを開きます（ショートカット: `Shift + S`）。
4. **アドイン** タブを選択します。
5. 「マイアドイン」の横にある緑色のプラスアイコン (**+**) をクリックします。
6. `fusion360_signboard_automator` フォルダを選択します。
7. **実行** をクリックします。

## 使い方

1. **デザイン** ワークスペースで、**ソリッド** タブに移動します。
2. **作成** パネルの下にある **Create Signboard** をクリックします。
3. 以下のオプションを含むダイアログが表示されます:
    - **Board Configuration**: 看板の幅、高さ、厚さ、角丸の半径を設定します。
    - **QR Code Configuration**: テキスト/URLを入力し、QRコードのサイズとXY座標を設定します。
    - **Instagram Icon Configuration**: アイコンの追加有無を切り替え、サイズとXY座標を設定します。
4. **OK** をクリックします。
5. アドインは以下を生成します:
    - 指定された寸法の `Signboard` コンポーネント。
    - 看板上に配置された `QR_Code` コンポーネント。
    - 看板上に配置された `Instagram_Icon` コンポーネント（選択された場合）。
6. 後で **パラメータの変更** (修正 > パラメータの変更) から看板の寸法を調整することができます。

## 依存関係

- このアドインには `lib` フォルダに `qrcode` ライブラリが同梱されています。外部のPythonインストールは不要です。

## ライセンス

MIT
