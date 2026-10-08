import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { THEATRE, producedIds } from "@/mro/components/story/theatre/script";
import { STORY_RUNS } from "@/mro/data/stories/runModel";
import { IO, type UseCaseKey } from "@/mro/data/stories/io";

const scripts = Object.entries(THEATRE).filter((e): e is [string, NonNullable<(typeof e)[1]>] => !!e[1]);

describe.each(scripts)("guided playback %s", (uc, script) => {
  const run = STORY_RUNS.find((r) => r.manifest === IO[uc as UseCaseKey].manifest);
  const docs = new Map(script.docs.map((d) => [d.id, d]));

  const referenced = new Set<string>([script.arrival.doc, ...producedIds(script)]);
  script.steps.forEach((s) => {
    s.fetch.forEach((f) => f.doc && referenced.add(f.doc));
    Object.values(s.signalDocs ?? {}).forEach((id) => referenced.add(id));
    Object.values(s.guardDocs ?? {}).forEach((id) => referenced.add(id));
    (s.tasks ?? []).forEach((t) => {
      if (t.kind === "choice") t.options.forEach((o) => (o.docs ?? []).forEach((id) => referenced.add(id)));
      if (t.kind === "email") (t.attach ?? []).forEach((id) => referenced.add(id));
      if (t.kind === "form") t.fields.forEach((f) => f.doc && referenced.add(f.doc));
    });
  });

  it("has a document behind every file it names", () => {
    expect([...referenced].filter((id) => !docs.has(id))).toEqual([]);
  });

  it("has unique document ids", () => {
    expect(docs.size).toBe(script.docs.length);
  });

  it.each(script.docs.map((d) => [d.id, d] as const))("renders %s as a page", (_id, doc) => {
    const html = renderToStaticMarkup(<>{doc.render()}</>);
    expect(html.length).toBeGreaterThan(200);
    expect(html).not.toMatch(/undefined|NaN|\[object Object\]/);
  });

  it("scripts one step per agent", () => {
    expect(run).toBeDefined();
    expect(script.steps.length).toBe(run!.steps.length);
  });

  it("decides only options the I/O offers", () => {
    script.steps.forEach((s, i) => {
      (s.tasks ?? []).forEach((ui, n) => {
        const task = run!.steps[i].tasks[n];
        expect(task, `step ${i} task ${n}`).toBeDefined();
        const ids = new Set(task.options.map((o) => o.id));
        const named =
          ui.kind === "choice" ? ui.options.map((o) => o.id) : ui.kind === "email" ? [ui.option] : [ui.accept, ...(ui.reject ? [ui.reject] : [])];
        expect(named.filter((id) => !ids.has(id)), `step ${i} task ${n}`).toEqual([]);
      });
    });
  });

  it("closes the case for every ending", () => {
    const endings = [undefined, ...run!.steps.flatMap((s) => s.tasks.flatMap((t) => t.options.filter((o) => o.endsRun).map((o) => o.id)))];
    endings.forEach((endedWith) =>
      (["en", "de"] as const).forEach((lang) => {
        const done = script.completion(lang, { endedWith, inputs: {} });
        expect(done.hero.value).toBeTruthy();
        expect(JSON.stringify(done)).not.toMatch(/undefined|NaN/);
      }),
    );
  });
});
