name: POPREDE RTP Auto Generator FINAL RESET + 5 MIN

on:
  schedule:
    - cron: "*/5 * * * *"
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - uses: actions/setup-node@v3
      with:
        node-version: "18"

    # ============================================================
    # DOWNLOAD CSV
    # ============================================================
    - name: Download Games CSV
      run: |
        curl -L -o games.csv \
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7pX1gQOWmhwR9ecnt59QUS7L-T5XBdDuA_dDwfag3BMz8voU3CbIbfTpq5pdtmYc67Wh3-FC17VUQ/pub?gid=0&single=true&output=csv"

    # ============================================================
    # GENERATE RTP (RESET + SOFT UPDATE)
    # ============================================================
    - name: Generate RTP JSON
      run: |
        node << 'EOF'
        const fs = require("fs");

        // ----------------------------
        // 1. LOAD CSV (TAB PRIORITY)
        // ----------------------------
        const csvText = fs.readFileSync("games.csv","utf8");
        let rows = csvText.trim().split("\n");

        rows = rows.map(r =>
          r.includes("\t") ? r.split(/\t+/) : r.split(/[,;]+/)
        );

        const head = rows.shift().map(h => h.trim());
        rows = rows.map(r=>{
          let o={};
          r.forEach((v,i)=>o[head[i]] = v.trim());
          return o;
        });

        // ----------------------------
        // 2. PROVIDER DETECT
        // ----------------------------
        function detectProvider(p){
          p = (p || "").trim().toLowerCase();
          if(p.startsWith("pg")) return "PG";
          if(p.startsWith("prag")) return "PRAGMATIC";
          return "OTHER";
        }

        const PG_list   = rows.filter(x => detectProvider(x.provider)==="PG");
        const PRAG_list = rows.filter(x => detectProvider(x.provider)==="PRAGMATIC");

        const PG_count   = PG_list.length;
        const PRAG_count = PRAG_list.length;

        // ----------------------------
        // 3. TIME CONTROL (BRASIL)
        // ----------------------------
        const now = new Date();
        const hourBR = (now.getUTCHours() - 3 + 24) % 24;

        // ----------------------------
        // 4. TREND ENGINE (DAILY)
        // ----------------------------
        const today = new Date().toISOString().split("T")[0];
        const trendDir  = `rtp-history/${today}`;
        const trendFile = `${trendDir}/trend.json`;

        fs.mkdirSync(trendDir,{recursive:true});

        let trend = "normal";

        if(!fs.existsSync(trendFile)){
          const pick = ["up","down","normal"];
          trend = pick[Math.floor(Math.random()*pick.length)];
          fs.writeFileSync(trendFile, JSON.stringify({trend}));
        } else {
          trend = JSON.parse(fs.readFileSync(trendFile)).trend;
        }

        // clean random 1 decimal
        function rand(min,max){
          return Number((Math.random()*(max-min)+min).toFixed(1));
        }

        // ----------------------------
        // 5. FULL DISTRIBUTION RESET
        // ----------------------------
        function generateRTP(count){
          let arr = [];

          const high = Math.min(5, count);
          const low  = Math.min(15, count-high);

          // High (90-99)
          for(let i=0;i<high;i++)
            arr.push(trend==="up" ? rand(93,99.9) : rand(90,96));

          // Low (50-70)
          for(let i=0;i<low;i++)
            arr.push(trend==="down" ? rand(50,65) : rand(55,70));

          // Mid (70-89)
          while(arr.length < count){
            if(trend==="up") arr.push(rand(78,93));
            else if(trend==="down") arr.push(rand(63,82));
            else arr.push(rand(70,90));
          }

          return arr.sort(()=>Math.random()-0.5)
                    .map(n => Number(n.toFixed(1)));
        }

        // ----------------------------
        // 6. BUILD RTP
        // ----------------------------
        let rtpPG, rtpPRAG;

        if(hourBR === 0){
          // RESET SETIAP 24 JAM (00 Brasil)
          rtpPG   = generateRTP(PG_count);
          rtpPRAG = generateRTP(PRAG_count);

        } else {
          // SOFT UPDATE 5 MENIT
          let old = {provider:{PG:[],PRAGMATIC:[]}};
          try { old = JSON.parse(fs.readFileSync("rtp.json")); } catch {}

          rtpPG = PG_list.map((_,i)=>{
            let base = old.provider.PG[i] ?? rand(70,90);
            let n = Number((base + rand(-2,2)).toFixed(1));
            return Math.max(50, Math.min(99.9, n));
          });

          rtpPRAG = PRAG_list.map((_,i)=>{
            let base = old.provider.PRAGMATIC[i] ?? rand(70,90);
            let n = Number((base + rand(-2,2)).toFixed(1));
            return Math.max(50, Math.min(99.9, n));
          });
        }

        // ----------------------------
        // 7. SAVE rtp.json
        // ----------------------------
        const output = {
          provider:{
            PG: rtpPG,
            PRAGMATIC: rtpPRAG
          }
        };

        fs.writeFileSync("rtp.json", JSON.stringify(output,null,2));

        // ----------------------------
        // 8. SAVE HISTORY
        // ----------------------------
        const hh = String(now.getHours()).padStart(2,"0");
        const mm = String(now.getMinutes()).padStart(2,"0");

        fs.writeFileSync(
          `${trendDir}/${hh}-${mm}.json`,
          JSON.stringify(output,null,2)
        );

        EOF

    # ============================================================
    # PUSH UPDATE
    # ============================================================
    - name: Push Updates
      run: |
        git config user.name "github-actions"
        git config user.email "github-actions@github.com"
        git add rtp.json rtp-history/
        git commit -m "Auto RTP Update (RESET + 5 MIN + 1 DEC)" || echo "No changes"
        git push

