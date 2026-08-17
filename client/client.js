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

//#region node_modules/lucide-react/dist/esm/shared/src/utils/mergeClasses.mjs
/**
* @license lucide-react v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const mergeClasses = (...classes) => classes.filter((className, index, array) => {
	return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();

//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils/toKebabCase.mjs
/**
* @license lucide-react v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils/toCamelCase.mjs
/**
* @license lucide-react v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const toCamelCase = (string) => string.replace(/^([A-Z])|[\s-_]+(\w)/g, (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase());

//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils/toPascalCase.mjs
const toPascalCase = (string) => {
	const camelCase = toCamelCase(string);
	return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};

//#endregion
//#region node_modules/lucide-react/dist/esm/defaultAttributes.mjs
/**
* @license lucide-react v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var defaultAttributes = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round"
};

//#endregion
//#region node_modules/lucide-react/dist/esm/shared/src/utils/hasA11yProp.mjs
/**
* @license lucide-react v1.31.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
const hasA11yProp = (props) => {
	for (const prop in props) if (prop.startsWith("aria-") || prop === "role" || prop === "title") return true;
	return false;
};

//#endregion
//#region node_modules/lucide-react/dist/esm/context.mjs
const LucideContext = (0, react.createContext)({});
const useLucideContext = () => (0, react.useContext)(LucideContext);

//#endregion
//#region node_modules/lucide-react/dist/esm/Icon.mjs
const Icon = (0, react.forwardRef)(({ color, size, strokeWidth, absoluteStrokeWidth, className = "", children, iconNode,...rest }, ref) => {
	const { size: contextSize = 24, strokeWidth: contextStrokeWidth = 2, absoluteStrokeWidth: contextAbsoluteStrokeWidth = false, color: contextColor = "currentColor", className: contextClass = "" } = useLucideContext() ?? {};
	const calculatedStrokeWidth = absoluteStrokeWidth ?? contextAbsoluteStrokeWidth ? Number(strokeWidth ?? contextStrokeWidth) * 24 / Number(size ?? contextSize) : strokeWidth ?? contextStrokeWidth;
	return (0, react.createElement)("svg", {
		ref,
		...defaultAttributes,
		width: size ?? contextSize ?? defaultAttributes.width,
		height: size ?? contextSize ?? defaultAttributes.height,
		stroke: color ?? contextColor,
		strokeWidth: calculatedStrokeWidth,
		className: mergeClasses("lucide", contextClass, className),
		...!children && !hasA11yProp(rest) && { "aria-hidden": "true" },
		...rest
	}, [...iconNode.map(([tag, attrs]) => (0, react.createElement)(tag, attrs)), ...Array.isArray(children) ? children : [children]]);
});

//#endregion
//#region node_modules/lucide-react/dist/esm/createLucideIcon.mjs
const createLucideIcon = (iconName, iconNode) => {
	const Component = (0, react.forwardRef)(({ className,...props }, ref) => (0, react.createElement)(Icon, {
		ref,
		iconNode,
		className: mergeClasses(`lucide-${toKebabCase(toPascalCase(iconName))}`, `lucide-${iconName}`, className),
		...props
	}));
	Component.displayName = toPascalCase(iconName);
	return Component;
};

//#endregion
//#region node_modules/lucide-react/dist/esm/icons/chevron-down.mjs
const __iconNode$3 = [["path", {
	d: "m6 9 6 6 6-6",
	key: "qrunsl"
}]];
const ChevronDown = createLucideIcon("chevron-down", __iconNode$3);

//#endregion
//#region node_modules/lucide-react/dist/esm/icons/package.mjs
const __iconNode$2 = [
	["path", {
		d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",
		key: "1a0edw"
	}],
	["path", {
		d: "M12 22V12",
		key: "d0xqtd"
	}],
	["polyline", {
		points: "3.29 7 12 12 20.71 7",
		key: "ousv84"
	}],
	["path", {
		d: "m7.5 4.27 9 5.15",
		key: "1c824w"
	}]
];
const Package = createLucideIcon("package", __iconNode$2);

//#endregion
//#region node_modules/lucide-react/dist/esm/icons/star.mjs
const __iconNode$1 = [["path", {
	d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
	key: "r04s7s"
}]];
const Star = createLucideIcon("star", __iconNode$1);

//#endregion
//#region node_modules/lucide-react/dist/esm/icons/triangle-alert.mjs
const __iconNode = [
	["path", {
		d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
		key: "wmoenq"
	}],
	["path", {
		d: "M12 9v4",
		key: "juzpu7"
	}],
	["path", {
		d: "M12 17h.01",
		key: "p32p05"
	}]
];
const TriangleAlert = createLucideIcon("triangle-alert", __iconNode);

//#endregion
//#region src/catalog.ts
/** Compact GitHub star counts for card metadata. */
function formatStars(stars) {
	if (stars < 1e3) return String(Math.round(stars));
	const thousands = stars / 1e3;
	return `${thousands < 100 ? Number(thousands.toFixed(1)) : Math.round(thousands)}k`;
}

//#endregion
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
	const rows = installedOnly ? installedOnlyRows(selected, catalog) : catalog;
	const types = [...new Set(rows.map((plugin) => plugin.entityType))];
	const typeCounts = /* @__PURE__ */ new Map();
	for (const plugin of rows) typeCounts.set(plugin.entityType, (typeCounts.get(plugin.entityType) ?? 0) + 1);
	const filtered = rows.filter((plugin) => {
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
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "目标 Profile" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "sb-select-wrap",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
							"aria-label": "目标 Profile",
							value: selectedProfile,
							onChange: (event) => {
								setSelectedProfile(event.target.value);
							},
							children: profiles.map((profile) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", { children: profile.name }, profile.name))
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChevronDown, { "aria-hidden": "true" })]
					})]
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "sb-toolbar",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "sb-tabs",
					role: "tablist",
					"aria-label": "目录范围",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						role: "tab",
						"aria-selected": !installedOnly,
						onClick: () => {
							setInstalledOnly(false);
							setEntity("all");
						},
						children: "发现"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						role: "tab",
						"aria-selected": installedOnly,
						onClick: () => {
							setInstalledOnly(true);
							setEntity("all");
						},
						children: [
							"已安装 (",
							Object.keys(selected?.dependencies ?? {}).length,
							")"
						]
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					type: "search",
					value: query,
					onChange: (event) => {
						setQuery(event.target.value);
					},
					placeholder: "搜索名称、作者或 npm 包",
					"aria-label": "搜索插件"
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("nav", {
				className: "sb-categories",
				"aria-label": "插件分类",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					"aria-pressed": entity === "all",
					onClick: () => {
						setEntity("all");
					},
					children: ["全部 ", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: rows.length })]
				}), types.map((type) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					"aria-pressed": entity === type,
					onClick: () => {
						setEntity(type);
					},
					children: [
						ENTITY_LABELS[type] ?? type,
						" ",
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: typeCounts.get(type) ?? 0 })
					]
				}, type))]
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
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "sb-icon",
									children: plugin.icon === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Package, { "aria-hidden": "true" }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										"aria-hidden": "true",
										children: plugin.name.charAt(0).toUpperCase()
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
										src: plugin.icon,
										alt: "",
										width: "48",
										height: "48",
										loading: "lazy",
										decoding: "async",
										onError: (event) => {
											event.currentTarget.hidden = true;
										}
									})] })
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "sb-heading",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: plugin.name }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: plugin.owner })]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "sb-description",
								children: plugin.description
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "sb-card-meta",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "sb-kind",
										children: ENTITY_LABELS[plugin.entityType] ?? plugin.entityType
									}),
									plugin.runsInstallScripts && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "sb-warning",
										title: "该包声明了安装脚本",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TriangleAlert, { "aria-hidden": "true" }), "安装脚本"]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "sb-stars",
										"aria-label": `${String(plugin.stars)} stars`,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Star, { "aria-hidden": "true" }), formatStars(plugin.stars)]
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "sb-meta",
								children: [plugin.packageName && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: plugin.packageName }), plugin.language && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: plugin.language })]
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
.sb-market{box-sizing:border-box;height:100%;min-height:500px;display:flex;flex-direction:column;gap:12px;color:inherit;overflow:hidden}
.sb-market *{box-sizing:border-box}
.sb-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.sb-head h2{font-size:20px;margin:0 0 4px}.sb-head p{margin:0;opacity:.62;font-size:13px}
.sb-profile{display:flex;align-items:center;gap:9px;font-size:12px;white-space:nowrap}.sb-profile>span:first-child{opacity:.66}
.sb-market select,.sb-market input,.sb-market button,.sb-market a{font:inherit}
.sb-market select,.sb-market input{height:34px;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:8px;background:color-mix(in srgb,currentColor 5%,transparent);color:inherit;padding:0 10px}
.sb-select-wrap{position:relative;display:block}.sb-profile select{width:108px;appearance:none;border-radius:9px;background:color-mix(in srgb,currentColor 7%,transparent);padding:0 32px 0 12px;cursor:pointer}.sb-profile select:hover{border-color:color-mix(in srgb,currentColor 30%,transparent);background:color-mix(in srgb,currentColor 10%,transparent)}.sb-profile select:focus-visible{outline:2px solid #5b8cff;outline-offset:2px;border-color:transparent}.sb-profile option{background:#2d2d30;color:#f2f2f3}.sb-select-wrap svg{position:absolute;right:10px;top:50%;width:14px;height:14px;transform:translateY(-50%);pointer-events:none;opacity:.62}
.sb-toolbar{display:grid;grid-template-columns:auto minmax(180px,1fr);gap:10px;align-items:center}
.sb-tabs{display:flex;gap:4px}
.sb-tabs button,.sb-pager button,.sb-actions button,.sb-actions a,.sb-dialog-actions button{border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:8px;background:transparent;color:inherit;padding:7px 11px;text-decoration:none;cursor:pointer}
.sb-tabs button[aria-selected=true]{background:color-mix(in srgb,#5b8cff 24%,transparent);border-color:#5b8cff;color:inherit}
.sb-categories{display:flex;align-items:center;gap:6px;overflow-x:auto;padding:0 1px 2px;scrollbar-width:none}.sb-categories::-webkit-scrollbar{display:none}.sb-categories button{height:28px;flex:none;border:1px solid transparent;border-radius:999px;background:transparent;color:inherit;padding:0 10px;font-size:12px;opacity:.66;cursor:pointer}.sb-categories button:hover{opacity:1;background:color-mix(in srgb,currentColor 5%,transparent)}.sb-categories button[aria-pressed=true]{border-color:color-mix(in srgb,currentColor 24%,transparent);background:color-mix(in srgb,currentColor 8%,transparent);opacity:1}.sb-categories span{margin-left:3px;font-size:10px;opacity:.56;font-variant-numeric:tabular-nums}
.sb-notice{display:flex;justify-content:space-between;gap:12px;border:1px solid color-mix(in srgb,#4ea871 55%,transparent);background:color-mix(in srgb,#4ea871 12%,transparent);border-radius:8px;padding:8px 10px;font-size:13px}
.sb-notice button{border:0;background:none;color:inherit;cursor:pointer}.sb-error{border-color:#d85d5d;background:color-mix(in srgb,#d85d5d 12%,transparent)}
.sb-results{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-content:start;gap:12px;padding:2px 5px 4px 2px}
.sb-card{min-height:208px;display:flex;flex-direction:column;border:1px solid color-mix(in srgb,currentColor 16%,transparent);border-radius:9px;padding:14px;background:color-mix(in srgb,currentColor 3%,transparent);transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease}
.sb-card:hover{transform:translateY(-2px);border-color:color-mix(in srgb,#5b8cff 42%,transparent);box-shadow:0 8px 22px color-mix(in srgb,#5b8cff 8%,transparent)}
.sb-card-title{display:flex;align-items:flex-start;gap:11px;min-width:0}
.sb-icon{position:relative;width:46px;height:46px;flex:0 0 46px;display:grid;place-items:center;overflow:hidden;border:1px solid color-mix(in srgb,currentColor 15%,transparent);border-radius:9px;background:color-mix(in srgb,currentColor 6%,transparent);font-size:17px;font-weight:700;opacity:.9}
.sb-icon>svg{width:21px;height:21px;opacity:.58}.sb-icon img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.sb-heading{min-width:0;padding-top:2px}.sb-card h3{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;line-height:1.35;margin:0 0 4px}.sb-card-title p{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;margin:0;opacity:.58}
.sb-description{min-height:39px;font-size:13px;line-height:1.5;opacity:.7;margin:12px 0 10px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.sb-card-meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:auto;min-height:23px}
.sb-kind,.sb-warning{display:inline-flex;align-items:center;gap:4px;height:22px;border-radius:6px;padding:0 7px;white-space:nowrap;font-size:11px;font-weight:600}
.sb-kind{background:color-mix(in srgb,#5b8cff 12%,transparent);color:color-mix(in srgb,#7fa3ff 85%,currentColor)}
.sb-warning{background:color-mix(in srgb,#f5b82e 11%,transparent);color:#e8a91c}.sb-warning svg{width:13px;height:13px}
.sb-stars{display:inline-flex;align-items:center;gap:4px;margin-left:auto;color:#f5b82e;font-size:12px;font-weight:650;font-variant-numeric:tabular-nums}.sb-stars svg{width:14px;height:14px;fill:currentColor}
.sb-card footer{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:11px;padding-top:10px;border-top:1px solid color-mix(in srgb,currentColor 10%,transparent)}
.sb-meta{min-width:0;display:flex;align-items:center;gap:7px;font-size:11px;opacity:.58}.sb-meta code{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:145px}
.sb-meta code,.sb-dialog code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.sb-actions{display:flex;align-items:center;gap:6px;white-space:nowrap}.sb-actions button,.sb-actions a{font-size:12px;padding:5px 9px}.sb-actions .sb-primary,.sb-dialog-actions .sb-primary{background:#4f7fe8;border-color:#4f7fe8;color:#fff}.sb-actions .sb-danger,.sb-dialog-actions .sb-danger{border-color:#cf6262;color:#ed8585}
.sb-muted{font-size:12px;opacity:.45}.sb-empty{grid-column:1/-1;align-self:center;text-align:center;opacity:.55;padding:48px}
.sb-pager{flex:none;min-height:44px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;border-top:1px solid color-mix(in srgb,currentColor 14%,transparent);padding-top:10px;font-size:12px}.sb-pager>div{display:flex;align-items:center;gap:10px}.sb-pager>label{justify-self:end}.sb-pager button{padding:6px 10px}.sb-pager button:disabled{opacity:.35;cursor:not-allowed}.sb-pager select{height:30px;padding:0 6px}
.sb-overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;background:rgba(0,0,0,.58);padding:20px}.sb-dialog{width:min(420px,100%);border:1px solid color-mix(in srgb,currentColor 20%,transparent);border-radius:14px;background:#29292c;color:#f2f2f3;padding:22px;box-shadow:0 24px 80px rgba(0,0,0,.45)}.sb-dialog h3{margin:0 0 12px}.sb-dialog p{font-size:13px;opacity:.75}.sb-dialog>code{display:block;border-radius:8px;background:rgba(255,255,255,.07);padding:10px;overflow-wrap:anywhere}.sb-dialog .sb-restart-note{color:#f5b82e}.sb-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}.sb-dialog-actions button:disabled{opacity:.55;cursor:wait}
@media(max-width:700px){.sb-market{height:calc(100vh - 170px)}.sb-head{align-items:stretch;flex-direction:column}.sb-profile{justify-content:space-between}.sb-toolbar{grid-template-columns:1fr}.sb-tabs{grid-column:1/-1}.sb-toolbar input{width:100%}.sb-results{grid-template-columns:1fr}.sb-card{min-height:196px}.sb-card footer{align-items:stretch;flex-direction:column}.sb-actions{justify-content:flex-end}.sb-pager{grid-template-columns:1fr auto}.sb-pager>span{display:none}.sb-pager>label{justify-self:end}}
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