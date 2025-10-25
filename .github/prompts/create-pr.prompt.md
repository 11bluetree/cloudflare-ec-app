---
mode: agent
---

以下の手順で、現在のリポジトリでPull Requestを作成する。

1. ブランチと差分の確認
   - featブランチ： [現在のブランチ]
   - ベースブランチ： [ブランチ名受け取る default: main]


2. Pull Requestのタイトルと本文の作成
   - PULL_REQUEST_TEMPLATE.mdのテンプレートに従って、タイトルと本文を作成
   - タイトルはConventional Commitsの形式に従う
   - 参照issueは指示でもらっていなければ催促する（ない場合も「ない」と回答もらうこと）

3. Pull Requestの作成
   - github MCPを使用してPull Requestを作成
   - github MCPがなければ、Github CLIを使用してPull Requestを作成
