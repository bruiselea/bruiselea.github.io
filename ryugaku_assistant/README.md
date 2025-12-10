# 留学アシスタント (Study Abroad Assistant)

留学経験者のアンケートデータを元に、LLM（Gemini）が留学の相談に乗ってくれるチャットボットです。

## セットアップ

1. **依存ライブラリのインストール**
   ```bash
   pip install -r requirements.txt
   ```

2. **Google Gemini APIキーの取得**
   - [Google AI Studio](https://aistudio.google.com/app/apikey) からAPIキーを取得してください。

## 実行方法

以下のコマンドでアプリを起動します。

```bash
streamlit run app.py
```

ブラウザが自動的に開き、チャット画面が表示されます。
サイドバーにAPIキーを入力して、質問を開始してください。

## ファイル構成

- `app.py`: Streamlitを使ったUIメインプログラム
- `data_loader.py`: Excelデータを読み込むモジュール
- `agent_logic.py`: 検索とLLM応答生成を行うロジック
- `留学アンケート_ダミーデータ.xlsx`: データソース
