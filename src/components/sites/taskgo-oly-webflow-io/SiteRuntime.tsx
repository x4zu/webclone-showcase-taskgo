"use client";

// Client runtime for the TaskGo clone. Replaces Webflow's webflow.js with:
//  1. Webflow components: mobile nav, tabs, forms.
//  2. An IX2 interpreter that replays the site's exported interaction data (ix2-data.json):
//     scroll-into-view, scrolling-in-view (scroll progress), click/second-click, hover, tab events.
//  3. The IX3 (GSAP) interactions, rebuilt from the registered config with GSAP + ScrollTrigger + SplitText.
// Values come from the source (docs/research/taskgo-oly-webflow-io/source/ix2.json, ix3.json).

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import ix2Raw from "./ix2-data.json";

gsap.registerPlugin(ScrollTrigger, SplitText);

/* ------------------------------------------------------------------ IX2 data types */

interface Ix2Target {
  id?: string;
  selector?: string;
  useEventTarget?: boolean | "CHILDREN" | "SIBLINGS";
}
interface Ix2ItemConfig {
  delay?: number;
  duration?: number;
  easing?: string;
  target?: Ix2Target;
  xValue?: number | null;
  yValue?: number | null;
  zValue?: number | null;
  xUnit?: string;
  yUnit?: string;
  zUnit?: string;
  value?: number;
  widthValue?: number;
  heightValue?: number;
  widthUnit?: string;
  heightUnit?: string;
  rValue?: number;
  gValue?: number;
  bValue?: number;
  aValue?: number;
  filters?: { type: string; value: number; unit: string }[];
}
interface Ix2Item {
  actionTypeId: string;
  config: Ix2ItemConfig;
}
interface Ix2Group {
  actionItems: Ix2Item[];
  keyframe?: number;
}
interface Ix2ActionList {
  id: string;
  useFirstGroupAsInitialState?: boolean;
  actionItemGroups?: Ix2Group[];
  continuousParameterGroups?: { id: string; type: string; continuousActionGroups: Ix2Group[] }[];
}
interface Ix2ContinuousConfig {
  continuousParameterGroupId: string;
  smoothing: number;
  startsEntering: boolean;
  addStartOffset: boolean;
  addOffsetValue: number;
  startsExiting: boolean;
  addEndOffset: boolean;
  endOffsetValue: number;
}
interface Ix2Event {
  id: string;
  eventTypeId: string;
  mediaQueries: string[];
  target: { id: string };
  action: { actionTypeId: string; config: { actionListId: string; delay?: number } };
  config: { loop?: boolean; delay?: number | null; scrollOffsetValue?: number | null } | Ix2ContinuousConfig[];
}
interface Ix2Data {
  events: Record<string, Ix2Event>;
  actionLists: Record<string, Ix2ActionList>;
  mediaQueries: { key: string; min: number; max: number }[];
}

const ix2 = ix2Raw as unknown as Ix2Data;

/* ------------------------------------------------------------------ easing */

// CSS cubic-bezier as a GSAP ease function (Webflow "ease" = cubic-bezier(.25,.1,.25,1)).
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const a = (t: number, p1: number, p2: number) => 3 * p1 * t * (1 - t) ** 2 + 3 * p2 * t ** 2 * (1 - t) + t ** 3;
  return (x: number) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (a(mid, x1, x2) < x) lo = mid;
      else hi = mid;
    }
    return a((lo + hi) / 2, y1, y2);
  };
}
const EASES: Record<string, gsap.EaseString | gsap.EaseFunction> = {
  "": "none",
  linear: "none",
  ease: cubicBezier(0.25, 0.1, 0.25, 1),
  easeIn: cubicBezier(0.42, 0, 1, 1),
  easeOut: cubicBezier(0, 0, 0.58, 1),
  easeInOut: cubicBezier(0.42, 0, 0.58, 1),
  inQuad: "power1.in",
  outQuad: "power1.out",
  inOutQuad: "power1.inOut",
  inCubic: "power2.in",
  outCubic: "power2.out",
  inOutCubic: "power2.inOut",
  inQuart: "power3.in",
  outQuart: "power3.out",
  inOutQuart: "power3.inOut",
  inQuint: "power4.in",
  outQuint: "power4.out",
  inOutQuint: "power4.inOut",
  inExpo: "expo.in",
  outExpo: "expo.out",
  inOutExpo: "expo.inOut",
  inBack: "back.in",
  outBack: "back.out",
  inOutBack: "back.inOut",
  outBounce: "bounce.out",
  inBounce: "bounce.in",
};
const easeOf = (name?: string) => EASES[name ?? ""] ?? "none";

/* ------------------------------------------------------------------ IX2 helpers */

const unit = (u?: string) => (u ? u.toLowerCase() : "px");

function propsOf(item: Ix2Item): gsap.TweenVars {
  const c = item.config;
  const v: gsap.TweenVars = {};
  switch (item.actionTypeId) {
    case "TRANSFORM_MOVE":
      if (c.xValue != null) v.x = `${c.xValue}${unit(c.xUnit)}`;
      if (c.yValue != null) v.y = `${c.yValue}${unit(c.yUnit)}`;
      if (c.zValue != null) v.z = `${c.zValue}${unit(c.zUnit)}`;
      break;
    case "TRANSFORM_SCALE":
      if (c.xValue != null) v.scaleX = c.xValue;
      if (c.yValue != null) v.scaleY = c.yValue;
      break;
    case "TRANSFORM_ROTATE":
      if (c.xValue != null) v.rotationX = c.xValue;
      if (c.yValue != null) v.rotationY = c.yValue;
      if (c.zValue != null) v.rotation = c.zValue;
      break;
    case "STYLE_OPACITY":
      v.opacity = c.value;
      break;
    case "STYLE_SIZE":
      if (c.widthUnit === "AUTO") v.width = "auto";
      else if (c.widthValue != null) v.width = `${c.widthValue}${unit(c.widthUnit)}`;
      if (c.heightUnit === "AUTO") v.height = "auto";
      else if (c.heightValue != null) v.height = `${c.heightValue}${unit(c.heightUnit)}`;
      break;
    case "STYLE_FILTER":
      v.filter = (c.filters ?? []).map((f) => `${f.type}(${f.value}${f.unit})`).join(" ");
      break;
    case "STYLE_BACKGROUND_COLOR":
      v.backgroundColor = `rgba(${c.rValue},${c.gValue},${c.bValue},${c.aValue})`;
      break;
    case "STYLE_BORDER":
      v.borderColor = `rgba(${c.rValue},${c.gValue},${c.bValue},${c.aValue})`;
      break;
  }
  return v;
}

function targetsOf(item: Ix2Item, trigger: Element): Element[] {
  const t = item.config.target ?? {};
  if (t.useEventTarget === true) return [trigger];
  if (t.useEventTarget === "CHILDREN" && t.selector) return Array.from(trigger.querySelectorAll(t.selector));
  if (t.useEventTarget === "SIBLINGS" && t.selector) {
    const sel = t.selector;
    return Array.from(trigger.parentElement?.children ?? []).filter((el) => el !== trigger && el.matches(sel));
  }
  if (t.selector) return Array.from(document.querySelectorAll(t.selector));
  if (t.id) return Array.from(document.querySelectorAll(`[data-w-id="${t.id.split("|").pop()}"]`));
  return []; // unbound target in the export: Webflow skips it too
}

const groupsOf = (list: Ix2ActionList) => list.actionItemGroups ?? [];

function applyInitial(list: Ix2ActionList, trigger: Element) {
  if (!list.useFirstGroupAsInitialState) return;
  for (const item of groupsOf(list)[0]?.actionItems ?? []) {
    const targets = targetsOf(item, trigger);
    if (targets.length) gsap.set(targets, propsOf(item));
  }
}

function buildTimeline(list: Ix2ActionList, trigger: Element, loop: boolean, delaySec: number) {
  const tl = gsap.timeline({ paused: true, delay: delaySec, repeat: loop ? -1 : 0 });
  const groups = groupsOf(list);
  let cursor = 0;
  for (let g = list.useFirstGroupAsInitialState ? 1 : 0; g < groups.length; g++) {
    let groupEnd = 0;
    for (const item of groups[g].actionItems) {
      const targets = targetsOf(item, trigger);
      const dur = (item.config.duration ?? 0) / 1000;
      const delay = (item.config.delay ?? 0) / 1000;
      groupEnd = Math.max(groupEnd, delay + dur);
      if (!targets.length) continue;
      tl.to(targets, { ...propsOf(item), duration: dur, ease: easeOf(item.config.easing), overwrite: "auto" }, cursor + delay);
    }
    cursor += groupEnd;
  }
  if (cursor === 0) tl.set({}, {}, 0);
  return tl;
}

// Continuous (scroll progress) action list -> per-target keyframed timeline driven by progress 0..1.
function buildContinuous(list: Ix2ActionList, trigger: Element) {
  const group = list.continuousParameterGroups?.[0];
  if (!group) return null;
  const tl = gsap.timeline({ paused: true });
  const frames = [...group.continuousActionGroups].sort((a, b) => (a.keyframe ?? 0) - (b.keyframe ?? 0));
  // Track the previous keyframe per target+property to tween between consecutive keyframes.
  const last = new Map<string, number>();
  for (const frame of frames) {
    const kf = (frame.keyframe ?? 0) / 100;
    frame.actionItems.forEach((item, index) => {
      const targets = targetsOf(item, trigger);
      if (!targets.length) return;
      const props = propsOf(item);
      const key = `${item.actionTypeId}|${JSON.stringify(item.config.target)}|${index}`;
      const prev = last.get(key);
      if (prev == null) tl.set(targets, props, kf);
      else tl.to(targets, { ...props, duration: Math.max(kf - prev, 0.0001), ease: easeOf(item.config.easing) }, prev);
      last.set(key, kf);
    });
  }
  tl.to({}, { duration: Math.max(0, 1 - tl.duration()) }, tl.duration());
  return tl;
}

function breakpointKey() {
  const w = window.innerWidth;
  return ix2.mediaQueries.find((q) => w >= q.min && w <= q.max)?.key ?? "main";
}

/* ------------------------------------------------------------------ IX2 runtime */

function initIx2(): () => void {
  const cleanups: (() => void)[] = [];
  const bp = breakpointKey();
  const continuous: { tl: gsap.core.Timeline; el: Element; cfg: Ix2ContinuousConfig; current: number }[] = [];
  const clickState = new WeakMap<Element, boolean>();
  const tabTimelines = new Map<Element, { active?: Ix2ActionList; inactive?: Ix2ActionList }>();

  for (const event of Object.values(ix2.events)) {
    if (!event.mediaQueries.includes(bp)) continue;
    const list = ix2.actionLists[event.action.config.actionListId];
    if (!list) continue;
    const id = event.target.id.split("|").pop();
    const triggers = Array.from(document.querySelectorAll(`[data-w-id="${id}"]`));
    const cfg = Array.isArray(event.config) ? undefined : event.config;
    const delaySec = ((cfg?.delay ?? 0) + (event.action.config.delay ?? 0)) / 1000;

    for (const el of triggers) {
      switch (event.eventTypeId) {
        case "SCROLL_INTO_VIEW": {
          applyInitial(list, el);
          const tl = buildTimeline(list, el, Boolean(cfg?.loop), delaySec);
          const offset = cfg?.scrollOffsetValue ?? 0;
          const io = new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (entry.isIntersecting) {
                  tl.play();
                  io.disconnect();
                }
              }
            },
            { rootMargin: `0px 0px -${offset}% 0px` },
          );
          io.observe(el);
          cleanups.push(() => {
            io.disconnect();
            tl.kill();
          });
          break;
        }
        case "SCROLLING_IN_VIEW": {
          const tl = buildContinuous(list, el);
          const c = Array.isArray(event.config) ? event.config[0] : undefined;
          if (tl && c) continuous.push({ tl, el, cfg: c, current: -1 });
          break;
        }
        case "MOUSE_CLICK": {
          applyInitial(list, el);
          const second = Object.values(ix2.events).find((e) => e.eventTypeId === "MOUSE_SECOND_CLICK" && e.target.id === event.target.id);
          const secondList = second ? ix2.actionLists[second.action.config.actionListId] : undefined;
          const onClick = () => {
            const open = clickState.get(el) ?? false;
            const next = open && secondList ? secondList : list;
            buildTimeline(next, el, false, 0).play();
            clickState.set(el, !open);
          };
          el.addEventListener("click", onClick);
          cleanups.push(() => el.removeEventListener("click", onClick));
          break;
        }
        case "MOUSE_OVER":
        case "MOUSE_OUT": {
          if (event.eventTypeId === "MOUSE_OVER") applyInitial(list, el);
          const type = event.eventTypeId === "MOUSE_OVER" ? "mouseenter" : "mouseleave";
          const handler = () => buildTimeline(list, el, false, 0).play();
          el.addEventListener(type, handler);
          cleanups.push(() => el.removeEventListener(type, handler));
          break;
        }
        case "TAB_ACTIVE":
        case "TAB_INACTIVE": {
          const entry = tabTimelines.get(el) ?? {};
          if (event.eventTypeId === "TAB_ACTIVE") entry.active = list;
          else entry.inactive = list;
          tabTimelines.set(el, entry);
          break;
        }
      }
    }
  }

  // Tabs drive TAB_ACTIVE / TAB_INACTIVE: initial state per current tab, then replay on change.
  for (const [el, lists] of tabTimelines) {
    if (lists.active) applyInitial(lists.active, el);
    const play = () => {
      const isActive = el.classList.contains("w--current");
      const l = isActive ? lists.active : lists.inactive;
      if (l) buildTimeline(l, el, false, 0).play();
    };
    if (el.classList.contains("w--current")) play();
    el.addEventListener("wf:tabchange", play);
    cleanups.push(() => el.removeEventListener("wf:tabchange", play));
  }

  // Scroll-progress interactions with Webflow's smoothing.
  if (continuous.length) {
    const tick = () => {
      const vh = window.innerHeight;
      for (const c of continuous) {
        const r = c.el.getBoundingClientRect();
        const top = r.top + window.scrollY;
        let start = c.cfg.startsEntering ? top - vh : top;
        let end = c.cfg.startsExiting ? top + r.height - vh : top + r.height;
        if (c.cfg.addStartOffset) start += (c.cfg.addOffsetValue / 100) * vh;
        if (c.cfg.addEndOffset) end -= (c.cfg.endOffsetValue / 100) * vh;
        const target = Math.min(1, Math.max(0, (window.scrollY - start) / Math.max(1, end - start)));
        const k = Math.max(0.02, 1 - c.cfg.smoothing / 100);
        c.current = c.current < 0 ? target : c.current + (target - c.current) * k;
        if (Math.abs(target - c.current) < 0.0005) c.current = target;
        c.tl.progress(c.current);
      }
    };
    gsap.ticker.add(tick);
    tick();
    cleanups.push(() => gsap.ticker.remove(tick));
  }

  return () => cleanups.forEach((fn) => fn());
}

/* ------------------------------------------------------------------ IX3 (GSAP interactions) */

function initIx3(): () => void {
  const ctx = gsap.context(() => {
    const splitChars = (el: Element) =>
      SplitText.create(el, { type: "words,chars", wordsClass: "gsap_split_word gsap_split_word++", charsClass: "gsap_split_letter gsap_split_letter++" }).chars;

    // i-7f757f35: page load, [split-text="true"] chars from opacity 0, skewX 20deg, z 20; stagger 0.02.
    // Duration/ease are not in the export (GSAP defaults assumed: 0.5s, power1.out).
    document.querySelectorAll('[split-text="true"]').forEach((el) => {
      gsap.from(splitChars(el), { opacity: 0, skewX: 20, z: 20, stagger: { each: 0.02 }, duration: 0.5, ease: "power1.out" });
    });

    // i-be34590b: [Section="Heading"] chars inside .heading-wraper.price; scrub 0.8, top 80 -> bottom 90%.
    document.querySelectorAll(".heading-wraper.price").forEach((trigger) => {
      const targets = Array.from(trigger.querySelectorAll('[Section="Heading"]')).flatMap(splitChars);
      if (!targets.length) return;
      gsap.fromTo(targets, { opacity: 0, z: 20, skewX: 20 }, { opacity: 1, z: 1, skewX: 0, stagger: { each: 0.05 }, ease: "none", scrollTrigger: { trigger, start: "top 80", end: "bottom 90%", scrub: 0.8 } });
    });

    // i-e8d37004: [data="StepCard"] y 40% -> 0%, skewX 9deg -> 0; stagger 0.2; 90 bottom -> bottom 90%.
    const steps = gsap.utils.toArray<HTMLElement>('[data="StepCard"]');
    if (steps.length) {
      gsap.fromTo(steps, { y: "40%", skewX: 9 }, { y: "0%", skewX: 0, stagger: { each: 0.2 }, ease: "none", scrollTrigger: { trigger: steps[0], start: "90 bottom", end: "bottom 90%", scrub: 0.8 } });
    }

    // i-5d4a73da / i-c356df76: review rows. Webflow targets these by element instance ("wf:inst");
    // the selectors below are the elements the live runtime resolved (recon/motion/gsap-triggers.json).
    // Three of them have no id or data-w-id, so they are addressed by class within their row.
    const reviewRow = (trigger: string, scrub: number, end: string, parts: [string, gsap.TweenVars, gsap.TweenVars][]) => {
      const el = document.querySelector(trigger);
      if (!el) return;
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 50%", end, scrub } });
      for (const [selector, from, to] of parts) {
        const t = el.querySelectorAll(selector);
        if (t.length) tl.fromTo(t, from, { ...to, ease: "none", duration: 0.5, stagger: { each: 0.2 } }, 0);
      }
    };
    reviewRow(".review-row-holder", 0.86, "bottom 80%", [
      ["#w-node-_7f0c34e2-d4b4-3521-f687-2b9d7ab878d2-68ae409d", { opacity: 0.5, scale: 0.8 }, { opacity: 1, scale: 1 }],
      ["#w-node-_7f0c34e2-d4b4-3521-f687-2b9d7ab878e5-68ae409d", { scale: 1.1, xPercent: -6 }, { scale: 1, xPercent: 0 }],
      [".clinet-image-wrap", { opacity: 0.35, scale: 0.9, skewX: 6 }, { opacity: 1, scale: 1, skewX: 0 }],
    ]);
    reviewRow(".review-02-row-holder", 0.8, "bottom 90%", [
      [".clinet-bottom-wrap", { opacity: 0.35, scale: 0.9, skewX: 6 }, { opacity: 1, scale: 1, skewX: 1 }],
      ["#w-node-_7f0c34e2-d4b4-3521-f687-2b9d7ab878f4-68ae409d", { scale: 1.1, rotationX: 40, xPercent: 11 }, { scale: 1, rotationX: 0, xPercent: 0 }],
      [".review-info-wrap", { opacity: 0.5, scale: 0.8 }, { opacity: 1, scale: 1 }],
    ]);

    // i-4c096e3f: every .heading-title, chars opacity 0 -> 1, skewX 30deg -> 0, stagger amount 0.5; top bottom -> bottom 50%.
    document.querySelectorAll(".heading-title").forEach((trigger) => {
      gsap.fromTo(splitChars(trigger), { opacity: 0, skewX: 30 }, { opacity: 1, skewX: 0, stagger: { amount: 0.5 }, ease: "none", scrollTrigger: { trigger, start: "top bottom", end: "bottom 50%", scrub: 0.8 } });
    });
  });
  document.documentElement.classList.add("w-mod-ix3");
  return () => {
    ctx.revert();
    document.documentElement.classList.remove("w-mod-ix3");
  };
}

/* ------------------------------------------------------------------ Webflow components */

function initComponents(): () => void {
  const cleanups: (() => void)[] = [];

  // Navbar (data-collapse="medium"): menu moves into a .w-nav-overlay with data-nav-menu-open.
  document.querySelectorAll<HTMLElement>(".w-nav").forEach((nav) => {
    const button = nav.querySelector<HTMLElement>(".w-nav-button");
    const menu = nav.querySelector<HTMLElement>(".w-nav-menu");
    if (!button || !menu) return;
    const home = menu.parentElement;
    const overlay = document.createElement("div");
    overlay.className = "w-nav-overlay";
    overlay.setAttribute("data-wf-ignore", "");
    nav.appendChild(overlay);
    let open = false;
    const duration = Number(nav.dataset.duration ?? 400) / 1000;
    const close = () => {
      if (!open) return;
      open = false;
      button.classList.remove("w--open");
      gsap.to(overlay, {
        height: 0,
        duration,
        ease: "power1.inOut",
        onComplete: () => {
          overlay.style.display = "none";
          menu.removeAttribute("data-nav-menu-open");
          home?.insertBefore(menu, home.firstChild === menu ? menu.nextSibling : home.children[1] ?? null);
        },
      });
    };
    const toggle = () => {
      if (open) return close();
      open = true;
      button.classList.add("w--open");
      overlay.appendChild(menu);
      menu.setAttribute("data-nav-menu-open", "");
      overlay.style.display = "block";
      gsap.fromTo(overlay, { height: 0 }, { height: menu.offsetHeight, duration, ease: "power1.inOut" });
    };
    const onLink = (e: Event) => {
      if ((e.target as Element).closest("a")) close();
    };
    button.addEventListener("click", toggle);
    menu.addEventListener("click", onLink);
    cleanups.push(() => {
      button.removeEventListener("click", toggle);
      menu.removeEventListener("click", onLink);
      overlay.remove();
    });
  });

  // Tabs
  document.querySelectorAll<HTMLElement>(".w-tabs").forEach((tabs) => {
    const links = Array.from(tabs.querySelectorAll<HTMLElement>(":scope > .w-tab-menu > .w-tab-link, :scope > div > .w-tab-link"));
    const panes = Array.from(tabs.querySelectorAll<HTMLElement>(":scope > .w-tab-content > .w-tab-pane"));
    const durIn = Number(tabs.dataset.durationIn ?? 300) / 1000;
    const select = (name: string) => {
      for (const link of links) {
        const active = link.dataset.wTab === name;
        const was = link.classList.contains("w--current");
        link.classList.toggle("w--current", active);
        link.setAttribute("aria-selected", String(active));
        if (was !== active) link.dispatchEvent(new Event("wf:tabchange"));
      }
      for (const pane of panes) {
        const active = pane.dataset.wTab === name;
        pane.classList.toggle("w--tab-active", active);
        if (active) gsap.fromTo(pane, { opacity: 0 }, { opacity: 1, duration: durIn, ease: "power1.out" });
      }
    };
    for (const link of links) {
      const onClick = (e: Event) => {
        e.preventDefault();
        if (link.dataset.wTab) select(link.dataset.wTab);
      };
      link.addEventListener("click", onClick);
      cleanups.push(() => link.removeEventListener("click", onClick));
    }
  });

  // Forms: no backend in a clone; show Webflow's success state locally.
  document.querySelectorAll<HTMLFormElement>(".w-form form").forEach((form) => {
    const onSubmit = (e: Event) => {
      e.preventDefault();
      const wrap = form.closest(".w-form");
      form.style.display = "none";
      wrap?.querySelector<HTMLElement>(".w-form-done")?.style.setProperty("display", "block");
    };
    form.addEventListener("submit", onSubmit);
    cleanups.push(() => form.removeEventListener("submit", onSubmit));
  });

  return () => cleanups.forEach((fn) => fn());
}

/* ------------------------------------------------------------------ mount */

export function SiteRuntime() {
  const pathname = usePathname();
  useEffect(() => {
    const disposeComponents = initComponents();
    const disposeIx3 = initIx3();
    const disposeIx2 = initIx2();
    ScrollTrigger.refresh();
    return () => {
      disposeIx2();
      disposeIx3();
      disposeComponents();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [pathname]);
  return null;
}
