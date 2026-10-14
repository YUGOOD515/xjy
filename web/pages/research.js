import { RiskLabSnapshotSchema } from "@/modules/eth-risk/risk-lab";
import {
  TransactionCheckRequestSchema,
  TransactionCheckReportSchema,
} from "@/domain/schemas/transaction-check";
import {
  esc,
  money,
  pct,
  time,
  pageHead,
  badge,
  panel,
  list,
  table,
  facts,
  explorer,
  rawDetails,
  request,
  jsonOptions,
  errorText,
  lifecycle,
  mountIdentity,
  assetTag,
} from "../ui.js";

export function transactionReportHTML(report) {
  const {
    transaction: t,
    supportedSwaps: swaps,
    evidence,
    scope,
  } = report.observation;
  return `<section class="report-conclusion bg-panel p-[25px] [margin:25px_0]">${badge(report.mode)}<h2>${esc(report.headline)}</h2><p>${esc(report.summary)}</p><small>核查时间 ${time(report.checkedAt)}</small></section><div class="workspace-grid grid grid-cols-[1fr_1fr] gap-7 [margin:24px_0] tablet:gap-[22px] phone:grid-cols-[1fr] phone:gap-[22px]">${panel("已确认的事实", list(report.confirmedFacts))}${panel("仍无法确认", list(report.uncertainties), "dark-panel")}${panel(
    "外层交易记录",
    `<p class="note">外层 ETH 金额不等于钱包净流出，也不等于卖出数量。</p>${facts(
      [
        ["状态", esc(t.status)],
        ["原生 ETH 金额", esc(t.nativeValueEth) + " ETH"],
        ["交易", explorer("tx", t.hash)],
        ["From", explorer("address", t.from)],
        ["To", t.to ? explorer("address", t.to) : "创建合约"],
        ["区块", explorer("block", String(t.blockNumber))],
        ["区块哈希", `<code>${esc(t.blockHash)}</code>`],
        ["区块时间", time(t.timestamp)],
        ["日志数", esc(t.logCount)],
      ],
    )}${rawDetails(t.input, "交易输入数据")}`,
    "wide",
  )}${panel(
    "指定池兑换证据",
    `<p>${esc(scope.poolLabel)}</p><p>${explorer("address", scope.poolAddress)}</p><div class="asset-pair flex gap-[30px] [margin:20px_0]">${assetTag("WETH")}${assetTag("USDC")}</div><p class="note">WETH 是包装 ETH；USDC 列为代币数量，不换算成美元。事件不合并为钱包净买卖方向。</p>${
      swaps.length
        ? table(
            ["日志", "方向", "WETH 数量", "USDC 数量"],
            swaps.map((s) => [
              esc(s.logIndex),
              s.direction === "SELL_ETH" ? "卖出 WETH" : "买入 WETH",
              esc(s.wethAmount),
              esc(s.usdcAmount),
            ]),
          )
        : `<p>${t.status === "REVERTED" ? "交易已回滚，无成功兑换事件。" : "未找到该池的兑换证据，不代表在其他池或场所没有卖出。"}</p>`
    }`,
    "wide",
  )}${panel("证据出处", list(evidence.map((e) => e.description)) + evidence.map((e) => `<div class="evidence-row [border-bottom:1px_solid_var(--color-line)] [padding:18px_0]">${e.type === "BLOCK" ? explorer("block", e.blockHash) : explorer("tx", e.txHash)}<p>${esc(e.source)}</p>${e.type === "CONTRACT_EVENT" ? explorer("address", e.contractAddress) : ""}</div>`).join(""))}${panel("下一步", list(report.nextSteps))}</div>`;
}
export function riskReportHTML(s) {
  return `<div class="status-band flex flex-wrap items-center gap-3 [padding:15px_0] text-[11px] text-ink-soft">${badge(s.dataMode, "warn")}<span>${esc(s.sourceNote)}</span><span>${time(s.asOf)}</span></div><div class="workspace-grid grid grid-cols-[1fr_1fr] gap-7 [margin:24px_0] tablet:gap-[22px] phone:grid-cols-[1fr] phone:gap-[22px]">${panel(
    "ETH 风险研究",
    facts([
      ["参考价", money(s.priceUsd)],
      ["综合分", esc(s.composite.score) + " / 100"],
      ["置信度", pct(s.composite.confidence * 100)],
      ["观察范围", esc(s.composite.horizon)],
    ]) +
      `<p>${esc(s.composite.interpretation)}</p><svg class="research-chart w-full h-auto max-h-[250px] mt-[18px]" viewBox="0 0 680 190" role="img" aria-label="研究样本的风险分数曲线"><line x1="42" y1="160" x2="638" y2="160"/><polyline points="${s.curve.map((p, i) => `${50 + i * 200},${160 - p.score * 1.18}`).join(" ")}"/>${s.curve.map((p, i) => `<text x="${40 + i * 200}" y="183">${esc(p.label)}</text><text x="${40 + i * 200}" y="${148 - p.score * 1.18}">${esc(p.score)}</text>`).join("")}</svg>`,
  )}${panel(
    "研究建议",
    badge(s.recommendation.stance) +
      `<h3>${esc(s.recommendation.action)}</h3><p>${esc(s.recommendation.rationale)}</p>${facts(
        [
          ["当前 ETH 敞口", pct(s.recommendation.currentExposurePct)],
          ["目标 ETH 敞口", pct(s.recommendation.targetExposurePct)],
          ["建议置信度", pct(s.recommendation.confidence * 100)],
        ],
      )}<p class="note">研究输出不批准或执行交易；分数与置信度不是经校准的下跌概率。</p>`,
    "dark-panel",
  )}</div><section class="workspace-panel [border-top:2px_solid_var(--color-ink)] [padding:23px_0] min-w-0 phone:[padding:22px_0]"><h2>观察输入</h2><div class="research-metrics grid grid-cols-4 gap-[22px] laptop:grid-cols-[repeat(3,1fr)] tablet:grid-cols-[1fr_1fr] phone:gap-5">${s.metrics.map((m) => `<article><div>${badge(m.state)}</div><h3>${esc(m.label)}</h3><strong>${esc(m.display)}</strong><small>${esc(m.unit)} / ${esc(m.direction)}</small><div class="meter h-[4px] bg-sand [margin:16px_0]"><i style="width:${m.percentile}%"></i></div><p>${esc(m.rationale)}</p></article>`).join("")}</div></section><section class="workspace-panel [border-top:2px_solid_var(--color-ink)] [padding:23px_0] min-w-0 phone:[padding:22px_0]"><h2>模型与依据</h2><div class="model-grid grid grid-cols-[1fr_1fr] gap-7 phone:grid-cols-[1fr]">${s.models.map((m) => `<article><div class="model-heading flex items-center justify-between gap-5"><h3>${esc(m.title)}</h3><strong>${m.score}</strong></div><p>${esc(m.method)} / Confidence ${pct(m.confidence * 100)}</p><p>${esc(m.output)}</p><code class="formula-block block bg-panel p-[15px] leading-[1.8]">${esc(m.formula)}</code><p>${esc(m.rationale)}</p>${list(m.inputs)}<small>${esc(m.citation)}</small></article>`).join("")}</div></section>${panel("数据出处与限制", s.evidence.map((e) => `<div class="evidence-row [border-bottom:1px_solid_var(--color-line)] [padding:18px_0]">${badge(e.status)}<h3>${esc(e.label)}</h3><p>${esc(e.value)}</p><small>${esc(e.source)}</small></div>`).join("") + `<p class="note">区块范围 ${s.blockRange.from} – ${s.blockRange.to}。当前 fixture 的“OBSERVED”仅指样本中的观测项，不能当作本次真实 RPC 读取。</p>` + rawDetails(s))}<a class="button-primary inline-flex justify-center items-center gap-[14px] [padding:12px_18px] min-h-[43px] [border:1px_solid_var(--color-ink)] [border-radius:3px] [background:var(--color-ink)] text-paper tablet:[padding:11px_13px]" href="/attestations?source=research">固定研究报告并存证</a>`;
}

export async function mount(root, kind) {
  const life = lifecycle(root);
  let clean = () => {},
    busy = false,
    queryRevision = 0;
  const config = {
    investigate: [
      "交易核验",
      "核对一笔 Ethereum 交易的外层事实与指定池兑换，保留能够确认和不能确认的边界。",
    ],
    "risk-lab": [
      "ETH 风险研究",
      "用同一份研究样本观察卖压、波动、杠杆、泡沫与左尾风险。",
    ],
  }[kind];
  root.innerHTML =
    pageHead(...config) +
    `<nav class="context-links flex gap-[25px] flex-wrap text-[12px] pb-5 mb-[10px] [border-bottom:1px_solid_var(--color-line)] phone:gap-[18px] phone:text-[11px]"><a href="/coins/ETH">ETH 数据与指纹</a><a href="/investigate">交易核验</a><a href="/risk-lab">风险研究</a><a href="/attestations">报告存证</a></nav>${kind === "risk-lab" ? '<div class="notice [color:#785133] [border-left:3px_solid_var(--color-clay)] [background:#ede2cf] [padding:13px_17px] [margin:20px_0]">当前接口为明确标记的研究样本，不是实时预测，也没有真实 AI 调查。</div><button class="button-secondary" data-research="reload">重读研究样本</button>' : `<form class="query-form [padding:26px_0] [border-bottom:1px_solid_var(--color-ink)] mb-6" id="research-query"><label for="query-value">Ethereum 交易哈希</label><div class="query-row flex gap-3 items-center mt-[10px] tablet:flex-wrap"><input id="query-value" name="value" required spellcheck="false" autocomplete="off" placeholder="0x + 64 位十六进制字符"><button class="button-primary inline-flex justify-center items-center gap-[14px] [padding:12px_18px] min-h-[43px] [border:1px_solid_var(--color-ink)] [border-radius:3px] [background:var(--color-ink)] text-paper tablet:[padding:11px_13px]" type="submit">核验这笔交易</button><button type="button" class="button-secondary" data-research="example">填入示例</button></div><p class="note">仅从配置的主网 RPC 读取；未配置或读取失败时不回退 Mock。${kind === "investigate" ? "目前仅解析 Uniswap V3 WETH/USDC 0.05% 池，不推断身份或后续去向。" : ""}</p></form>`}<p id="research-error" class="error-band" role="alert" hidden></p><div id="research-result"></div>`;
  const err = root.querySelector("#research-error"),
    result = root.querySelector("#research-result");
  function clearQueryResult() {
    queryRevision++;
    err.hidden = true;
    err.textContent = "";
    result.innerHTML = "";
    clean();
    clean = mountIdentity(root);
  }
  async function load() {
    if (busy || !life.alive) return;
    clearQueryResult();
    const revision = queryRevision;
    let query;
    if (kind !== "risk-lab") {
      const value = root.querySelector("#query-value").value.trim();
      const check = TransactionCheckRequestSchema.safeParse({ txHash: value });
      if (!check.success) {
        err.textContent = "请输入完整的 Ethereum 交易哈希。";
        err.hidden = false;
        return;
      }
      query = check.data;
    }
    busy = true;
    root
      .querySelectorAll('.query-form button,.query-form input,[data-research="reload"]')
      .forEach((b) => (b.disabled = true));
    result.innerHTML = '<p class="loading text-[13px] text-ink-soft">正在读取并校验数据…</p>';
    try {
      const data = await request(
        kind === "investigate" ? "/api/transaction-checks" : "/api/eth-risk",
        kind === "investigate" ? TransactionCheckReportSchema : RiskLabSnapshotSchema,
        { ...(query ? jsonOptions("POST", query) : {}), signal: life.signal },
      );
      if (!life.alive || revision !== queryRevision) return;
      const requestedValue = query?.txHash;
      if (requestedValue && root.querySelector("#query-value").value.trim().toLowerCase() !== requestedValue.toLowerCase()) {
        clearQueryResult();
        return;
      }
      if (kind === "investigate" && data.observation.transaction.hash.toLowerCase() !== query.txHash.toLowerCase())
        throw new Error("服务返回的报告与本次查询不一致，无法展示为已核验结果。");
      result.innerHTML =
        kind === "investigate" ? transactionReportHTML(data) : riskReportHTML(data);
      clean();
      clean = mountIdentity(root);
    } catch (e) {
      if (life.alive && revision === queryRevision) {
        result.innerHTML = "";
        err.textContent = errorText(e);
        err.hidden = false;
      }
    } finally {
      busy = false;
      if (life.alive)
        root
          .querySelectorAll('.query-form button,.query-form input,[data-research="reload"]')
          .forEach((b) => (b.disabled = false));
    }
  }
  life.on("input", (e) => {
    if (e.target.id === "query-value") clearQueryResult();
  });
  life.on("submit", (e) => {
    if (e.target.id === "research-query") {
      e.preventDefault();
      void load();
    }
  });
  life.on("click", (e) => {
    const b = e.target.closest("[data-research]");
    if (!b || b.disabled) return;
    if (b.dataset.research === "example") {
      root.querySelector("#query-value").value =
        "0x19b45706e3877b8cb19133dbdc6f8013a5a4a033495e7b070c84977620348e8a";
      clearQueryResult();
    } else void load();
  });
  clean = mountIdentity(root);
  if (kind === "risk-lab") void load();
  return () => {
    life.dispose();
    clean();
  };
}
