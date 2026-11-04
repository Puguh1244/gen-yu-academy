import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: ["public/js/public-school.js"],
  bundle: true,
  write: false,
  format: "iife",
  plugins: [
    {
      name: "public-db-mock",
      setup(b) {
        b.onResolve({ filter: /services\/supabase\.js$/ }, () => ({
          path: "db",
          namespace: "mock",
        }));
        b.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
          contents: `
      export const configured=true;
      export const db={rpc:async(name)=>{if(name!=='website_feed')throw Error('Form must use server');return{data:{}}}};
      export async function result(q){return(await q).data}
      export const fileUrl=()=>'';
    `,
        }));
      },
    },
  ],
});

test("the form uses the email API, distinguishes a failed email from a failed submission, and restores the submit button", async () => {
  for (const language of ["id", "en"])
    for (const outcome of [true, false, "error"]) {
      const requests = [],
        modals = [],
        toasts = [];
      const button = { disabled: false };
      let resets = 0;
      const context = vm.createContext({
        document: {
          readyState: "complete",
          documentElement: { lang: language },
          querySelectorAll: () => [],
          getElementById: () => null,
        },
        window: {
          addEventListener: () => {},
          render: () => {},
          openModal: (...args) => modals.push(args),
          toast: (value) => toasts.push(value),
        },
        FormData: class extends Map {
          constructor() {
            super(
              Object.entries({
                name: "Parent",
                email: "parent@example.test",
                phone: "0800000000",
                programme: "Toddler",
                age: "2",
                consent: "on",
              }),
            );
          }
        },
        fetch: async (url, options) => {
          requests.push({ url, body: JSON.parse(options.body) });
          if (outcome === "error") throw new Error("Network unavailable");
          return {
            ok: true,
            json: async () => ({
              ok: true,
              id: "reference",
              emailSent: outcome,
            }),
          };
        },
      });
      vm.runInContext(bundle.outputFiles[0].text, context);
      await context.window.GENYU_LIVE.submitEnquiry({
        querySelector: () => button,
        reset: () => resets++,
      });
      assert.equal(requests[0].url, "/api/enquiries");
      assert.equal(requests[0].body.email, "parent@example.test");
      assert.equal(requests[0].body.language, language);
      assert.equal(requests[0].body.consent, true);
      assert.equal(button.disabled, false);
      if (outcome === "error") {
        assert.equal(resets, 0);
        assert.equal(modals.length, 0);
        assert.equal(toasts.length, 1);
      } else {
        assert.equal(resets, 1);
        assert.equal(toasts.length, 0);
        assert.match(
          modals[0][1],
          outcome
            ? language === "id"
              ? /telah dikirim/
              : /has been sent/
            : language === "id"
              ? /tidak perlu mengisi ulang/
              : /do not need to submit/,
        );
      }
    }
});
