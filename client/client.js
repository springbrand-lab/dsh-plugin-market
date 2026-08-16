window.__ModuleLoader__.load({ id: "@springbrand/dsh-plugin-marketplace", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let react = require("react");
react = __toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
react_jsx_runtime = __toESM(react_jsx_runtime);

//#region src/client/Marketplace.tsx
const API = "/springbrand-market";
const OPERATION_KEY = "springbrand-market:last-operation";
const PAGE_SIZES = [
	24,
	48,
	96
];
const ENTITY_LABELS = {
	bundle: "插件包",
	skill: "技能",
	"agent-preset": "Agent 预设",
	"mcp-server": "MCP 服务",
	"cordis-plugin": "Cordis 插件",
	installed: "已安装"
};
function formatStars(stars) {
	if (stars < 1e3) return String(Math.round(stars));
	const thousands = stars / 1e3;
	return `${thousands < 100 ? Number(thousands.toFixed(1)) : Math.round(thousands)}k`;
}
async function json(path, init) {
	const response = await fetch(`${API}${path}`, {
		...init,
		headers: init?.body === void 0 ? void 0 : { "content-type": "application/json" },
		cache: "no-store"
	});
	const value = await response.json();
	if (!response.ok) throw new Error(typeof value.error === "string" ? value.error : `请求失败（HTTP ${String(response.status)}）`);
	return value;
}
function actionText(action) {
	if (action === "install") return "安装";
	if (action === "update") return "更新";
	return "卸载";
}
function sleep(milliseconds) {
	return new Promise((resolve) => {
		setTimeout(resolve, milliseconds);
	});
}
async function reloadAfterRestart() {
	await sleep(2e3);
	const deadline = Date.now() + 3e4;
	while (Date.now() < deadline) try {
		await json("/profiles");
		window.location.reload();
		return;
	} catch {
		await sleep(600);
	}
	throw new Error("DSH 重启超时，请手动重新启动");
}
function installedOnlyRows(profile, catalog) {
	if (profile === void 0) return [];
	const byPackage = new Map(catalog.flatMap((plugin) => plugin.packageName === void 0 ? [] : [[plugin.packageName, plugin]]));
	return Object.entries(profile.dependencies).map(([packageName, version]) => byPackage.get(packageName) ?? {
		id: `installed:${packageName}`,
		name: packageName,
		owner: "Profile dependency",
		url: "",
		description: `已安装版本 ${version}`,
		category: "installed",
		entityType: "installed",
		stars: 0,
		packageName,
		installable: true,
		runsInstallScripts: false
	});
}
function Marketplace() {
	const [catalog, setCatalog] = (0, react.useState)([]);
	const [profiles, setProfiles] = (0, react.useState)([]);
	const [currentProfile, setCurrentProfile] = (0, react.useState)("web");
	const [selectedProfile, setSelectedProfile] = (0, react.useState)("web");
	const [installedOnly, setInstalledOnly] = (0, react.useState)(false);
	const [query, setQuery] = (0, react.useState)("");
	const [entity, setEntity] = (0, react.useState)("all");
	const [page, setPage] = (0, react.useState)(1);
	const [pageSize, setPageSize] = (0, react.useState)(24);
	const [draft, setDraft] = (0, react.useState)();
	const [busy, setBusy] = (0, react.useState)(false);
	const [loading, setLoading] = (0, react.useState)(true);
	const [status, setStatus] = (0, react.useState)("");
	const [error, setError] = (0, react.useState)("");
	const loadProfiles = async () => {
		const value = await json("/profiles");
		setProfiles(value.profiles);
		setCurrentProfile(value.currentProfile);
		setSelectedProfile((previous) => value.profiles.some((profile) => profile.name === previous) ? previous : value.currentProfile);
		return value;
	};
	(0, react.useEffect)(() => {
		const saved = sessionStorage.getItem(OPERATION_KEY);
		if (saved !== null) {
			sessionStorage.removeItem(OPERATION_KEY);
			setStatus(saved);
		}
		Promise.all([json("/catalog"), loadProfiles()]).then(([directory]) => {
			setCatalog(directory.plugins);
		}).catch((cause) => {
			setError(cause instanceof Error ? cause.message : String(cause));
		}).finally(() => {
			setLoading(false);
		});
	}, []);
	(0, react.useEffect)(() => {
		setPage(1);
	}, [
		query,
		entity,
		installedOnly,
		selectedProfile,
		pageSize
	]);
	(0, react.useEffect)(() => {
		if (draft === void 0) return;
		const close = (event) => {
			if (event.key === "Escape" && !busy) setDraft(void 0);
		};
		window.addEventListener("keydown", close);
		return () => {
			window.removeEventListener("keydown", close);
		};
	}, [draft, busy]);
	const selected = profiles.find((profile) => profile.name === selectedProfile);
	const installedNames = new Set(Object.keys(selected?.dependencies ?? {}));
	const types = (0, react.useMemo)(() => [...new Set(catalog.map((plugin) => plugin.entityType))], [catalog]);
	const filtered = (installedOnly ? installedOnlyRows(selected, catalog) : catalog).filter((plugin) => {
		if (entity !== "all" && plugin.entityType !== entity) return false;
		const needle = query.trim().toLowerCase();
		return needle === "" || `${plugin.name} ${plugin.owner} ${plugin.description} ${plugin.packageName ?? ""}`.toLowerCase().includes(needle);
	});
	const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
	const safePage = Math.min(page, pageCount);
	const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
	const submit = async () => {
		if (draft === void 0) return;
		setBusy(true);
		setError("");
		try {
			const result = await json("/action", {
				method: "POST",
				body: JSON.stringify({
					action: draft.action,
					profile: selectedProfile,
					...draft.action === "install" ? { id: draft.id } : { packageName: draft.packageName }
				})
			});
			const message = `${draft.title} ${actionText(draft.action)}完成`;
			if (result.restartRequired) {
				sessionStorage.setItem(OPERATION_KEY, `${message}，DSH 已重启`);
				setStatus(`${message}，正在重启 DSH…`);
				await json("/restart", {
					method: "POST",
					body: "{}"
				});
				await reloadAfterRestart();
			} else {
				setStatus(`${message}；${selectedProfile} 下次启动时生效`);
				setDraft(void 0);
				await loadProfiles();
			}
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : String(cause));
		} finally {
			setBusy(false);
		}
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
		className: "sb-market",
		"aria-label": "插件市场",
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: MARKET_STYLE }),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
				className: "sb-head",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: "插件市场" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "发现并管理 DeepSeek Harness 插件" })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
					className: "sb-profile",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "目标 Profile" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
						value: selectedProfile,
						onChange: (event) => {
							setSelectedProfile(event.target.value);
						},
						children: profiles.map((profile) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", { children: profile.name }, profile.name))
					})]
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "sb-toolbar",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "sb-tabs",
						role: "tablist",
						"aria-label": "目录范围",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							role: "tab",
							"aria-selected": !installedOnly,
							onClick: () => {
								setInstalledOnly(false);
							},
							children: "发现"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "tab",
							"aria-selected": installedOnly,
							onClick: () => {
								setInstalledOnly(true);
							},
							children: [
								"已安装 (",
								Object.keys(selected?.dependencies ?? {}).length,
								")"
							]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						type: "search",
						value: query,
						onChange: (event) => {
							setQuery(event.target.value);
						},
						placeholder: "搜索名称、作者或 npm 包",
						"aria-label": "搜索插件"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
						value: entity,
						onChange: (event) => {
							setEntity(event.target.value);
						},
						"aria-label": "插件类型",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
							value: "all",
							children: "全部类型"
						}), types.map((type) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
							value: type,
							children: ENTITY_LABELS[type] ?? type
						}, type))]
					})
				]
			}),
			(status !== "" || error !== "") && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: error === "" ? "sb-notice" : "sb-notice sb-error",
				role: "status",
				children: [error || status, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "关闭提示",
					onClick: () => {
						setError("");
						setStatus("");
					},
					children: "×"
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "sb-results",
				children: loading ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: "sb-empty",
					children: "正在读取插件目录…"
				}) : visible.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: "sb-empty",
					children: "没有匹配的插件"
				}) : visible.map((plugin) => {
					const installed = plugin.packageName !== void 0 && installedNames.has(plugin.packageName);
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
						className: "sb-card",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "sb-card-title",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: plugin.name }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", { children: [plugin.owner, plugin.stars > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "sb-stars",
									children: ["★ ", formatStars(plugin.stars)]
								})] })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "sb-kind",
									children: ENTITY_LABELS[plugin.entityType] ?? plugin.entityType
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "sb-description",
								children: plugin.description
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "sb-meta",
								children: [
									plugin.packageName && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: plugin.packageName }),
									plugin.language && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: plugin.language }),
									plugin.runsInstallScripts && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										title: "该包声明了安装脚本",
										children: "含安装脚本"
									})
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "sb-actions",
								children: [plugin.url !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
									href: plugin.page ?? plugin.url,
									target: "_blank",
									rel: "noreferrer",
									children: "详情"
								}), installed && plugin.packageName !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										setDraft({
											action: "update",
											packageName: plugin.packageName,
											title: plugin.name
										});
									},
									children: "更新"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									className: "sb-danger",
									type: "button",
									onClick: () => {
										setDraft({
											action: "remove",
											packageName: plugin.packageName,
											title: plugin.name
										});
									},
									children: "卸载"
								})] }) : plugin.installable && plugin.packageName !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									className: "sb-primary",
									type: "button",
									onClick: () => {
										setDraft({
											action: "install",
											id: plugin.id,
											packageName: plugin.packageName,
											title: plugin.name
										});
									},
									children: "安装"
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "sb-muted",
									children: "仅展示"
								})]
							})] })
						]
					}, plugin.id);
				})
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
				className: "sb-pager",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
						"共 ",
						filtered.length,
						" 项"
					] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: safePage <= 1,
							onClick: () => {
								setPage(safePage - 1);
							},
							children: "上一页"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [
							safePage,
							" / ",
							pageCount
						] }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: safePage >= pageCount,
							onClick: () => {
								setPage(safePage + 1);
							},
							children: "下一页"
						})
					] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: ["每页 ", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
						value: pageSize,
						onChange: (event) => {
							setPageSize(Number(event.target.value));
						},
						children: PAGE_SIZES.map((size) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", { children: size }, size))
					})] })
				]
			}),
			draft !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "sb-overlay",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "sb-dialog",
					role: "dialog",
					"aria-modal": "true",
					"aria-labelledby": "sb-dialog-title",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("h3", {
							id: "sb-dialog-title",
							children: ["确认", actionText(draft.action)]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", { children: [
							"将在 ",
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: selectedProfile }),
							" Profile 中",
							actionText(draft.action),
							"："
						] }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: draft.packageName }),
						selectedProfile === currentProfile && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "sb-restart-note",
							children: "完成后 DSH 会自动重启，页面将短暂断开。"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "sb-dialog-actions",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: busy,
								onClick: () => {
									setDraft(void 0);
								},
								children: "取消"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: draft.action === "remove" ? "sb-danger" : "sb-primary",
								type: "button",
								disabled: busy,
								autoFocus: true,
								onClick: () => {
									submit();
								},
								children: busy ? "执行中…" : `确认${actionText(draft.action)}`
							})]
						})
					]
				})
			})
		]
	});
}
const MARKET_STYLE = `
.sb-market{box-sizing:border-box;height:min(720px,calc(100vh - 210px));min-height:500px;display:flex;flex-direction:column;gap:12px;color:inherit;overflow:hidden}
.sb-market *{box-sizing:border-box}.sb-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.sb-head h2{font-size:20px;margin:0 0 4px}.sb-head p{margin:0;opacity:.62;font-size:13px}.sb-profile{display:flex;align-items:center;gap:8px;font-size:12px;white-space:nowrap}.sb-market select,.sb-market input,.sb-market button,.sb-market a{font:inherit}.sb-market select,.sb-market input{height:34px;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:8px;background:color-mix(in srgb,currentColor 5%,transparent);color:inherit;padding:0 10px}.sb-toolbar{display:grid;grid-template-columns:auto minmax(180px,1fr) auto;gap:10px;align-items:center}.sb-tabs{display:flex;gap:4px}.sb-tabs button,.sb-pager button,.sb-actions button,.sb-actions a,.sb-dialog-actions button{border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:8px;background:transparent;color:inherit;padding:7px 11px;text-decoration:none;cursor:pointer}.sb-tabs button[aria-selected=true]{background:color-mix(in srgb,#5b8cff 24%,transparent);border-color:#5b8cff;color:inherit}.sb-notice{display:flex;justify-content:space-between;gap:12px;border:1px solid color-mix(in srgb,#4ea871 55%,transparent);background:color-mix(in srgb,#4ea871 12%,transparent);border-radius:8px;padding:8px 10px;font-size:13px}.sb-notice button{border:0;background:none;color:inherit;cursor:pointer}.sb-error{border-color:#d85d5d;background:color-mix(in srgb,#d85d5d 12%,transparent)}.sb-results{flex:1;min-height:0;overflow:auto;display:grid;align-content:start;gap:10px;padding-right:4px}.sb-card{border:1px solid color-mix(in srgb,currentColor 16%,transparent);border-radius:12px;padding:14px;background:color-mix(in srgb,currentColor 4%,transparent)}.sb-card-title{display:flex;justify-content:space-between;gap:12px}.sb-card h3{font-size:15px;margin:0 0 4px}.sb-card-title p{font-size:12px;margin:0;opacity:.7}.sb-stars{color:#f5b82e;margin-left:6px;font-weight:650}.sb-kind{font-size:11px;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:999px;padding:3px 8px;white-space:nowrap;height:max-content}.sb-description{font-size:13px;line-height:1.5;opacity:.74;margin:10px 0;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}.sb-card footer{display:flex;justify-content:space-between;align-items:flex-end;gap:12px}.sb-meta{display:flex;flex-wrap:wrap;align-items:center;gap:7px;font-size:11px;opacity:.68}.sb-meta code,.sb-dialog code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.sb-actions{display:flex;align-items:center;gap:7px;white-space:nowrap}.sb-actions button,.sb-actions a{font-size:12px;padding:5px 9px}.sb-actions .sb-primary,.sb-dialog-actions .sb-primary{background:#4f7fe8;border-color:#4f7fe8;color:#fff}.sb-actions .sb-danger,.sb-dialog-actions .sb-danger{border-color:#cf6262;color:#ed8585}.sb-muted{font-size:12px;opacity:.45}.sb-empty{align-self:center;text-align:center;opacity:.55;padding:48px}.sb-pager{flex:none;min-height:44px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;border-top:1px solid color-mix(in srgb,currentColor 14%,transparent);padding-top:10px;font-size:12px}.sb-pager>div{display:flex;align-items:center;gap:10px}.sb-pager>label{justify-self:end}.sb-pager button{padding:6px 10px}.sb-pager button:disabled{opacity:.35;cursor:not-allowed}.sb-pager select{height:30px;padding:0 6px}.sb-overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;background:rgba(0,0,0,.58);padding:20px}.sb-dialog{width:min(420px,100%);border:1px solid color-mix(in srgb,currentColor 20%,transparent);border-radius:14px;background:#29292c;color:#f2f2f3;padding:22px;box-shadow:0 24px 80px rgba(0,0,0,.45)}.sb-dialog h3{margin:0 0 12px}.sb-dialog p{font-size:13px;opacity:.75}.sb-dialog>code{display:block;border-radius:8px;background:rgba(255,255,255,.07);padding:10px;overflow-wrap:anywhere}.sb-dialog .sb-restart-note{color:#f5b82e}.sb-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}.sb-dialog-actions button:disabled{opacity:.55;cursor:wait}
@media(max-width:700px){.sb-market{height:calc(100vh - 170px)}.sb-head{align-items:stretch;flex-direction:column}.sb-profile{justify-content:space-between}.sb-toolbar{grid-template-columns:1fr 1fr}.sb-tabs{grid-column:1/-1}.sb-toolbar input{grid-column:1/2;width:100%}.sb-card footer{align-items:stretch;flex-direction:column}.sb-actions{justify-content:flex-end}.sb-pager{grid-template-columns:1fr auto}.sb-pager>span{display:none}.sb-pager>label{justify-self:end}}
`;

//#endregion
//#region src/client/index.ts
const inject = ["slots"];
/** Add the marketplace as an independent Web Settings section. */
function apply(ctx) {
	ctx.slots.inject("settings.section", () => ctx.slots.register({
		name: "settings.section",
		id: "springbrand-plugin-marketplace",
		order: 50,
		label: "插件市场"
	}, Marketplace));
}

//#endregion
exports.apply = apply;
exports.inject = inject;
return module.exports; } });
//# sourceMappingURL=client.js.map