import { test } from "bun:test";
import { scrapeDuckduckgo } from "./ddg_search";

try {
    test("DuckDuckGo Scraper", async () => {
        const results = await scrapeDuckduckgo("asgore runs over dess");
        console.log(results);
    })
} catch {}
