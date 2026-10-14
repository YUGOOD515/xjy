# 更新记录

按日期倒序保留各轮接入、验收与交付说明（原 README 顶部内容，原文保留，仅修正相对链接）。当前结构与运行方式以 [README](../README.md) 为准；文中“上方/本节”等相对说法指本文件内的位置。

## 2026-10-14 Update · 删除 Aave 扩展与旧链上报告接口，精简前端依赖

- 删除 Aave 只读仓位扩展（`/position`、`POST /api/position`、`src/extensions/aave/` 及专项测试/文档）与旧钱包链上报告接口 `POST /api/onchain-analysis`；`pnpm data:analyze` CLI 使用的 `analyzeOnchainData` 保留。
- 前端去掉 `three` 与 `ethers`：流体雕塑改为原生 WebGL2（向 GPU 提交的着色器源码、上下文参数、几何与矩阵与原 Three.js r155 管线逐字节/逐值一致），指纹 NFT 部署/铸造改用已有的 `viem`。同时移除 `@aave-dao/aave-address-book` 与 `shader-park-core`（GLSL 已预编译入库，修改雕塑源码时临时安装，见 `scripts/compile-sculpture.mjs`）。
- 样式：设计变量只在 `@theme` 定义一次，简单布局规则改为模板中的 Tailwind 工具类（`laptop:`/`tablet:`/`phone:` 断点变体），`web/style.css` 2187 → 1367 行；类名保留为脚本/测试钩子。
- README 历史更新移至本文件；根目录 A2D/C2D/D2A/D2C 交接文档、`.loopx/`、`work/` 归档到 `docs/`。
- 验证：980 passed / 6 skipped，typecheck/build/隔离HTTP/指纹合约/雕塑校验通过。视觉对比（用户授权）：24 个页面状态 × 1440/1024/390 宽度的全部元素计算样式与旧版一致；雕塑在手动步进时钟下 6 币种 × 3 宽度 × 4 帧及 2x DPR 共 80 帧逐像素一致。

## 2026-10-08 Update — WebMCP 外部 Agent 真实报告

`/report` 已改为 ETH 市场与生态调查工作台：网站复用资产观察首页与 ETH 详情的数据，外部 Agent 在支持 WebMCP 的应用内浏览器调用六个工具，提交带引用的报告。网站提供数据与格式/引用校验，**不再在真实报告流程请求内置模型**。无需钱包、LLM Key 或 Ethereum RPC Key；旧钱包链上规则接口仍需要 RPC，AI 模式现返回 HTTP 410。

页面保留 VERDANT 主题与国际主义排版，报告可切换 **A4 阅读版 / JSON 数据版**，支持复制、下载；只保存当前页面会话。网站采集的事实、外部解释与未知项分别标明。暂无论文来源，现有指标明确为工程统计。Guardian、Risk Lab、收藏与存证边界保持独立。

启动 `pnpm dev`，在支持 WebMCP 的浏览器打开 `/report`，准备数据后让外部 Agent 调查并提交。六工具与输入示例见 [WebMCP 报告使用说明](webmcp-reports.md)。普通浏览器可以准备数据，但不能以此获得 Agent 调查；工具已注册也不代表 Agent 已运行。

以下按日期保留历史接入与验收记录；2026-10-07 的内置 DeepSeek 报告用法已被本次 WebMCP 方式取代。最新验收：1085 passed / 6 skipped，typecheck/build/隔离HTTP通过；原生WebMCP六工具与真实24h/7d报告回写、A4/JSON、手机布局和引用跳转均已实测。ChatGPT自身Site Tools客户端UI仍待确认。证据见 [本轮验收](webmcp-report-acceptance.md)。

## 2026-10-08 Update — BOT 主网存证接线与已知交易核验

本地当前报告存证已统一为主网677，默认使用已核验的 `RiskReportRegistry`：`0x1bA50A79BEB8d44c0f9ff1D4dBdDCa523eFb340e`。官方RPC `https://rpc.botchain.ai`，浏览器 `https://scan.botchain.ai`；旧测试网的公共env变量不用于本轮主网存证。NFT与registry是不同合约，不能共用此地址。

用户给出的 [交易](https://scan.botchain.ai/tx/0x7de08a6cdbc77c938014c2178f92927665b79ac5ec8762d99b08c931bf84eb73) 是成功的报告哈希发布（不是合约创建）；运行时代码、回执、发布事件、mapping和区块时间已只读核验一致。原报告JSON未提供，所以只能证明hash发布，不能核对原文。证据与边界见[主网验收](bot-mainnet-acceptance.md)。

主网本地状态按677隔离，旧不明/测试网待确认记录保留并阻止新签名，不自动清理或重发。历史968报告可解析，但不会在主网核验旧anchor。BOT接线当轮测试1050 passed / 6 skipped，typecheck/build通过，独立安全复审无未解决的重要问题；最新整体验收见上节。本轮无新广播、私钥/环境文件修改或BOT钱包交互验收。

## 2026-10-07 Update · 真实报告收尾（本地候选版）

新增 `/report` 与 `POST /api/onchain-analysis`：输入钱包，读取同一快照的原生 ETH/USDC 持仓、Chainlink 行情和 Uniswap V3 单池相邻五分钟卖压，展示规则风险、事实、解释、未知项和链上引用。旧 Risk Lab 样本与 Guardian Mock/Fork 保留。报告无交易权限，不要求钱包连接；真实数据可能正常或风险较低，不能固定演示高分。

页面可显式选择 RULES 或 AI。AI 接线已实现；用户提供凭据后，**DeepSeek 在已保存真实快照及受控边界输入上已实测通过**，完整实时 HTTP 和浏览器链路已各成功一次，公共 RPC 稳定性仍未通过。缺配置、RPC/模型失败明确报错，不回退规则、旧数据或 Mock。默认旧 CLI/Guardian 装配不变；这是固定工具读侧＋模型解释，不称自主调查 Agent。

历史区块查找从当前锚点向前括界再二分，不假设出块间隔。完整 CLI 已实际读取成功一次（区块 `26141022`，观察时间 `2026-10-07T14:11:47.000Z`）：卖压 `0.4960×`，Risk `20`，Confidence `0.72`。随后公共 RPC 的 HTTP/CLI 测试仍有失败；dRPC 抓到限流，另一个公共节点历史合约读取失败。**查询优化不能保证公共 RPC 稳定，真实 HTTP 收尾仍需可用的专用 RPC。** 没有修改本地私密 `.env.local`，没有加入自动重试或备用节点。

本地检查：1043 passed / 6 skipped，typecheck/build 通过，隔离 HTTP 12 页面及旧 Mock 闭环/重复事件阻止通过；新报告受控测试 42 项。独立审阅无重要代码发现。新接口实际 HTTP 200 成功报告见[实测 JSON](evidence/2026-10-07-real-report/http-live-report.json)，区块 `26141090`、Risk `20`；但浏览器后续仍遇限流，此前成功页面在线验收未通过；本次模型配置后已成功一次。浏览器已检查 RPC 失败与 AI 缺配置提示；DeepSeek 后续实测见[验收更新](real-report-acceptance.md)，不把历史输入的模型成功算作完整在线页面验收。

启动：`pnpm install --frozen-lockfile` → 配置本地 `ETHEREUM_RPC_URL` → `pnpm dev` → `/report`。AI 只在明确选择后运行，配置说明见[真实报告接口](onchain-report.md)。讲稿、网络失败备份与提交清单见[演示手册](demo-runbook.md)。本功能已合入 main（`86a3d14`）；比赛演示材料（D 统一稿）：[PPT 逐页内容](hackathon/presentation.md)、[6 分钟讲稿](hackathon/talk-script.md)、[提交说明](hackathon/submission.md)。正式比赛提交与回执仍未完成。

剩余：专用 RPC 完整 HTTP/页面验收；公共 RPC 稳定性验收（AI HTTP/页面已各成功一次）；完整主线录屏；确认发布后 Git 集成、正式比赛提交及回执。Mock 收藏、Risk Lab 实验、独立 Mock/Fork 保护保持清楚标签，主网交易与 BOT 部署不纳入本轮。

## 2026-10-07 Update · B/C 交付整合

以下为当时发布记录，后续接线进度以顶部真实报告 Update 为准。

A 的真实只读代码已在 main。本轮移植 B 的解释材料、AI 调查 Adapter 和测试，整合 C v2 验收记录；B 的独立初始化 Git 历史不覆盖主仓。

**当前编码分工：B 负责真实 AI 调查模块，Codex 在队长本地负责 A 的真实数据接线和统一集成；C 负责权限与受限执行验收，D 负责页面和比赛交付。B 需要写代码，独立验收不是 B 的唯一任务。** 后续独立代码任务通过 PR 交付，公共合同和共享文件由集成负责人顺序协调。

AI Adapter 保持现有 `InvestigationResult` 合同：未配置 Key、请求超时、HTTP/JSON/schema 错误明确失败，不静默退回规则；模型 evidence 必须来自给定目录，未知十六进制引用和显式区块引用拒绝；强制保留证据限制，模型 Confidence 不得提升既有引用覆盖上限。模型解释标为未经独立核实的推断，不能当作已证实因果。快照复制、超时覆盖响应体，无重试、签名或执行。

**交付代码不等于真实 Agent 已跑通。** 当前网页、`analyzeOnchainData` 和 Guardian 默认仍使用原规则/Mock/Fork 装配；设置 `LLM_API_KEY/LLM_API_URL/LLM_MODEL` 不会自动启用 Adapter。模型服务选择、运行接线、外部模型调用、中文质量、工具协作和通用 AI 比较仍待验收。本轮测试使用受控模型响应，不冒充在线调用。

本轮本地验证：**998 passed / 6 skipped**（AI 边界 21 项），typecheck/build、合约一致性、5 项指纹/本地 EVM、隔离 HTTP 11 路由及 shader 检查通过；独立安全复审完成。

下一步：真实 A→B 单次读侧接进报告页面；随后显式装配并在线验收 AI。保持本地 Mock 收藏和实验标签，不启用主网自动交易。C 的 Windows 超时及历史回执缺失记录保留；原因推测与证实事实分开，见 [C 集成复核附注](c-acceptance-review.md#集成复核附注2026-10-07)。

## 2026-10-07 Update · 逐项换真与团队执行分工

**当前主线：真实 Ethereum 数据 → 调查 → 可复查报告。Codex 统一负责 A 接线和集成，B 负责 AI 调查编码，队长决定范围与发布；A/C/D 负责数据核验、安全验收和页面/演示交付，不四路同时改同一核心流程。** 以下是工作安排，不代表队员已认领或完成。

公开行情与本地 Mock 收藏已通过 [PR #6](https://github.com/cinderharbor7/xjy/pull/6) 合入 main（`e1364be`），PR/main CI 通过。Aave 仓位本轮从主导航、ETH 工作台和研究导航隐藏；底层只读模块、原 `/position` 深链接及 `/api/position` 保留，不作为比赛展示主线。

### TODO 与完成标准

| 状态 / 优先级 | 工作 | 完成标准 | 实现 / 独立验收 |
| --- | --- | --- | --- |
| [x] 已完成 | 默认公开行情 | Binance USDT 快照、来源/时间/过期状态；加载和失败不补 Demo；只有手动选择演示才用样本 | Codex / A、D |
| [x] 本轮完成 | 隐藏 Aave 入口 | 主导航、ETH 工作台、研究导航无 Aave 链接；原只读路由/API 回归通过 | Codex / D |
| [ ] P0，下一项 | 真实卖压接入页面报告 | 复用现有 A→B 单次只读能力；相邻两个 5m 窗口、单池 gross 卖出额、基线、交易/区块引用、采集时间可查；正常窗口如实描述，失败不补 fixture | Codex / A、B、D |
| [ ] P0 | 可复查解释 | 明确区分事实、推断和未知项；关键结论对应真实引用；风险分数/Confidence 标为未校准规则，不当作下跌概率 | Codex / B |
| [ ] P0，代码已交付/接入待定 | 真实 Agent 调查 | Adapter 代码已整合，尚未装配/在线验收；先确定模型服务与凭据；Agent 使用核验工具并引用实际结果，支持正常/异常/证据不足情况，不编造因果，不调用 Executor | B 编码、Codex 集成 / C 验收 |
| [ ] P1，依赖上述报告 | 持续只读监控 | 先冻结真实触发、恢复与新鲜度规则；同窗口不重复当新事件；陈旧/RPC失败明确停止本轮分析 | Codex / A、B、C |
| [ ] P1，独立实验 | 真实分析接入 Fork 保护 | 同一链实例/钱包，批准金额基于冻结快照；Policy 门控、approve/swap、独立 after、效果验证；重启/重复事件/未知回执不重复广播 | Codex / C、A |
| [ ] P2，单独验收 | BOT 存证与真实 NFT 收藏 | 确认网络与部署条件；实际部署、用户签名、回执和链上查询留证；测试网不能冒充主网有效部署 | Codex / C、D、队长钱包确认 |

比赛前优先完成 P0；P1/P2 按剩余时间排期，不为扩大功能牺牲主线。**本地 Mock 收藏按用户已确认的需求继续保留，未校准的 Risk Lab 模型保持实验标签，主网自动交易不在本轮范围。** 不新增 Aave 功能、币种执行范围或没有数据依据的预测模型。

### A/B/C/D 具体交付

| 角色 | 本轮负责什么 | 要交付的可检查材料 |
| --- | --- | --- |
| Codex（统一代码负责人） | 按 TODO 实现 A 数据接线、整合 B 交付、测试和独立审阅；维护进度与来源标签 | 每项 PR/提交、测试结果、实际接口记录及剩余限制；不把代码存在当作在线验收 |
| A（数据核验） | 核对 ETH/WETH、USDC 单位、单池范围、相邻窗口/基线、区块时间和原始交易；不新增 Aave 任务 | 正常/异常或候选案例的真实引用与数据口径；RPC/基线为零等失败记录，不能制造异常 |
| B（AI 调查编码与方法验收） | 维护 `src/modules/investigation/` 的真实模型 Adapter、提示词、引用校验和失败测试；与 Codex 对齐装配；检验方法增量 | 一份逐条结论—证据核对表、一个证据不足反例、实际比较结果；不能虚构用户需求或调查效果 |
| C（安全与执行验收） | 检查 Agent 无执行权限、Policy/白名单/额度门控；仅在明确 Fork 范围复验回执和 after；核对 BOT 部署材料 | 未批准不执行、重复事件、未知回执、after 失败等验收记录；真实签名/主网发布由队长单独确认 |
| D（页面与比赛交付） | 检查主线页面与来源标签；组织讲稿、录屏、PPT和提交材料，区分在线运行与历史记录 | 两分钟演示路径、正常/失败页面核验、备份录屏及提交清单；视觉修改先交需求，不并行覆盖核心文件 |
| 队长 | 确认人员认领、优先级、模型服务/凭据及部署权限；最终核验作品和提交回执 | 认领/交付时间、实际验收确认和赛事提交回执；10月8日12:00截止，内部目标10:30 |

各人以最新 main 核验。B 默认提交独立调查模块代码与测试；A/C/D 提供数据核对、验收和材料。其他代码任务由队长明确划定独立文件/分支，再交 PR，不直接推 main，不同时改公共 schema/API/装配。凭据不提交 Git，不在群里发送私钥。旧技术目录分工保留作为模块边界，**不代表本轮仍要求四个人并行编码**。

本轮 Aave 隐藏改动本地验收：Vitest **977 passed / 6 skipped**，typecheck/build、11 路由隔离 HTTP 检查和独立只读审阅通过。未执行本轮视觉验收、真实钱包签名或主网交易。TODO 状态只随实际交付更新，不把规划记为完成；执行状态继续记录在[同一冲刺计划](loopx/plans/2026-10-07-hackathon-demo-sprint.md)。

## 2026-10-07 历史 Update · 全站原生前端与币种指纹

已通过 [PR #5](https://github.com/cinderharbor7/xjy/pull/5) 合入 `main`，合并提交 `2f2ed63`（北京时间 18:52）。本地主工作区已快进同步并重新安装依赖；四人后续从最新 `main` 建分支。GitHub CI 全部通过；Vitest **969 passed / 6 skipped**，另有隔离指纹/EVM **5 passed**，typecheck、build、合约、HTTP 与生产 shader 检查通过。跳过项、真实钱包与公共链部署不记为通过。

网站前端现已统一为 **HTML、CSS、原生 JavaScript、Tailwind CSS**，使用瑞士式排版和 xjy 原有的暖纸色、深绿与陶土色。货币指纹已融入币种首页、详情、持仓和调查页面，不再作为单独子站。原 TypeScript 业务服务、数据合同、Guardian 权限与去重规则保留。

入口：`/` 资产观察、`/coins/ETH` 币种详情、`/guardian` 保护实验、`/investigate` 交易核验、`/risk-lab` 风险研究、`/position` Aave 只读、`/attestations` 报告存证、`/collection` 指纹收藏。

逐项替换 Mock 的第一项：资产首页和有行情的币种页默认读取现有公开快照（Binance Spot USDT 交易对；全市场情绪来自 Alternative.me）。加载/读取失败显示缺失，过期来源明确标记；只有手动“切换演示”才显示样本。明确选择会在本浏览器会话保留。WETH/USDC 身份页不捏造行情；这些数据未成为 Guardian 自动交易输入。

运行：`pnpm dev`；生产构建与运行：`pnpm build`、`pnpm start`。默认端口仍为 3000。已有服务运行时，可在构建后使用 `pnpm dev:preview` 打开 **3100 端口的隔离 Mock 预览**，不改动原 `.guardian` 状态。集成阶段已实际操作新版首页、保护实验和真实交易核验；指纹 GPU、移动端排版及真实钱包交互仍待验收。

完整结构、迁移映射和验证方式见 [统一前端说明](unified-frontend.md)。[货币指纹 PRD](currency-fingerprint/PRD.md)记录数据与 NFT 子能力。下方保留历史项目背景和验收记录；涉及旧 Next 前端、原首页地址及旧视觉结构时，以本节和统一前端说明为准。

本次整合纳入 A 的真实案例、B 的方法卡与待验证对照、C 的验收记录，见 [本地整合验收](local-integration-acceptance.md)。BOT 存证与指纹 NFT 代码已纳入，但公开测试网部署/铸造和主网部署尚未验收；当前配置为测试网 968，不能作为赛题要求的主网 677 有效部署材料。核心调查仍无真实自主 Agent。

## 2026-10-07 · 比赛方案冻结

本次作品固定为：**可复查的 Ethereum 异动调查原型，附受限保护执行实验。** 候选任务是由承担 ETH 线索核验的投研/运营人员，交付有出处的事实、解释与未知项；使用者、采用与付费仍是假设。

- 量化能力：A→B 真实单次主网快照，比较相邻 5 分钟窗口的单池卖压；Risk Score、Confidence 是未校准的确定性规则。
- 证据能力：独立 `/investigate` 核验外层交易及固定池兑换，保留精确数量、出处和不能确认项。
- 应用实验：原 Guardian 的 Policy → Mock/Fork 减仓 → 独立 after/verification 保留；真实信号尚未接入持续交易监控。
- Agent 状态：当前没有真实 AI/Agent 调查参与，规则报告不构成自主 Agent；这是评分缺口，不通过改名掩盖。本轮冻结不授权模型接入、修改合同、主网执行或新增功能。

产品口径与验收真源：[比赛冻结方案](loopx/design/2026-10-07-hackathon-freeze/需求设计文档.md)。四人交付与状态真源：[冲刺执行计划](loopx/plans/2026-10-07-hackathon-demo-sprint.md)。北京时间 10 月 8 日 12:00 截止，内部提前提交目标为 10:30。方案已写好不代表队员已执行或作品已提交。

以下保留历史实现与验收记录；出现展示定位冲突时以冻结方案为准，历史测试不能替代现场验收。

## 2026-10-07 历史 Update · 交易核验 MVP

新增独立只读入口 **[/investigate](http://localhost:3000/investigate)**：输入 Ethereum 交易哈希，查看外层转账事实、指定池内的买卖证据，以及仍无法确认的部分。场景是“看到大额 ETH 转账消息，想核对这笔交易究竟支持什么说法”。商业需求尚未经过真实用户验证。

- 数据来自服务器配置的 Ethereum 主网 RPC；示例按钮查询真实交易，不用存档或 Mock 代替在线结果。
- 当前只核验 Uniswap V3 WETH/USDC **0.05% 单池**。普通转账不会直接被解释为卖出；发现本池卖出事件也不等于证明全笔交易净卖出或市场下跌原因。
- 中文解释由确定性规则生成；没有真实 LLM、地址身份鉴定、内部 trace、后续路径或全市场监控。USDC 数量不被当成美元估值。
- 新入口不连接钱包、不签名、不交易，也不访问 Guardian 事件数据库。既有保护 Demo 保留，可从导航切换。

在 `.env.local` 配置 `ETHEREUM_RPC_URL`，然后运行 `pnpm dev`，打开上方入口。没有 RPC 时会明确报配置错误，不会退回 Mock。运行范围、接口与验收步骤见 [transaction-check.md](transaction-check.md)，新查询合同见 [OpenAPI](transaction-check-api.openapi.json)。

本次验收：`pnpm typecheck`、`pnpm build` 通过，`pnpm test` **896 passed / 2 skipped**；新增功能 127 项通过。真实主网转账、买入、卖出 HTTP 查询通过；浏览器通过真实转账、卖出和输入/未找到错误测试。独立审阅发现的事件引用缺口已修复并复审通过。两个跳过项仍是需显式配置的既有 Fork 测试。

## 2026-10-07 Update · 第一版集成已合并

A、B、C、D 的第一版交付已通过 [PR #3](https://github.com/cinderharbor7/xjy/pull/3) 合入 `main`，合并提交为 `3d264a2`。后续开发从最新 `main` 建新分支，继续沿用冻结的数据合同和四人模块边界。

- 工程检查：`pnpm typecheck`、`pnpm build` 通过；`pnpm test` 为 **769 passed / 2 skipped**。两个跳过项需要显式 Fork 配置，未计为通过。
- 默认 Mock 页面：Computer use 实测 Risk **91**、Confidence **88%**、Policy 批准、ETH → USDC、风险敞口 **100% → 70%**，独立验证 **PASSED**。
- 权限与事件：提高 Policy 阈值后，Agent 仍建议换仓，但 Execution 为 **Skipped**；同一事件重复运行被拦截，监控启停和刷新保留已有事件。
- 真实读取与本机执行：A→B 主网单次只读分析通过；本机 Anvil Fork 的 HTTP → Policy → swap → 独立 after → 验证通过；Aave 独立只读页面也完成浏览器查询验收。

**当前尚未接通真实链上信号驱动的持续调查和交易监控。** 首页监控仍使用 Demo 风险变化和 Mock investigation；真实主网分析目前是单次只读入口。BOT 存证分支未纳入本次集成，也没有完成主网部署验收。详细范围与证据见 [团队集成验收](team-integration-acceptance.md)。
