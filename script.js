const observeDOM = (function () {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    return function (obj, callback) {
        if (!obj || obj.nodeType !== 1) return;

        if (MutationObserver) {
            // define a new observer
            var mutationObserver = new MutationObserver(callback)

            // have the observer observe for changes in children
            mutationObserver.observe(obj, { childList: true, subtree: true })
            return mutationObserver
        }

        // browser support fallback
        else if (window.addEventListener) {
            obj.addEventListener('DOMNodeInserted', callback, false)
            obj.addEventListener('DOMNodeRemoved', callback, false)
        }
    }
})()

const waitForElm = (selector) => new Promise(resolve => {
    if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(mutations => {
        if (document.querySelector(selector)) {
            resolve(document.querySelector(selector));
            observer.disconnect();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

observeDOM(document.querySelector(".breadcrumb"), e => {
    parsePage();
})

const parsePage = () => {
    const cardViewBody = waitForElm("[class*='CardView_body__']");
    const sfData = fetch(chrome.runtime.getURL('scryfall_arena_data.json')).then(r => r.json())
    const simpleName = s => s.split(/\//g)[0].trim().replace(/\W/g, "_").toLowerCase();
    Promise.all([sfData, cardViewBody]).then(([sf, cvb]) => {
        sf.forEach(c => c.n = simpleName(c.name));
        const sfm = sf.reduce((a, c) => { a[c.n] = c; return a }, {});

        const cards = Array.from(cvb.querySelectorAll("[class*='CardView_card__']")).map(e => ({
            e: e,
            name: name = e.querySelector("[class*='Card_name__']").innerText,
            n: n = simpleName(name),
            card: sfm[n],
            label: l = e.querySelector("[class*='Card_label']"),
            tmpcv: [fm, pcv, dcv, scv] = !l ? [] : l.innerText.split(/(\d+)% of (\d+) decks\n(-?\+?\d+)/),
            stats: {
                prc: pcv * 1,
                decks: dcv * 1,
                synergy: scv * 1
            }
        }));
        cards.forEach(c => {
            c.e.classList.add(!c.card ? "not-on-arena" : "is-on-arena")
        });
        const arena_cards = cards.filter(c => !!c.card);
        arena_cards.forEach(e => {
            e.arena_name = e.card.name.split("/")[0].trim();
            if (!!e.card.slashes) {
                e.arena_name = e.card.name.replace(/\/+/, new Array(e.card.slashes + 1).join("/"))
            }
        });

        /* ACTIONS */
        const EXPORT_BUTTON = document.createElement("span");
        EXPORT_BUTTON.innerText = "📋";
        EXPORT_BUTTON.title = "Copy to clipboard";
        EXPORT_BUTTON.classList.add("btn", "btn-light", "ml-3")
        const commander = `1 ${document.querySelector(".page-heading")?.innerText.split(/\/|\(/)[0].trim()}`;
        const text = arena_cards.reduce((a, c) => `${a}1 ${c.arena_name}\n`, "");
        const decklist = `Commander\n${commander}\n\nCards\n${text}`;
        EXPORT_BUTTON.addEventListener("click", e => {
            writeTextToClipboard(decklist);
            console.log(arena_cards)
        });

        document.body.classList.add("hide-not-on-arena")
        const HIDE_NOT_ARENA = document.createElement("span");
        HIDE_NOT_ARENA.innerText = "👁";
        HIDE_NOT_ARENA.title = "Show All Cards";
        HIDE_NOT_ARENA.classList.add("btn", "btn-light", "ml-3")
        HIDE_NOT_ARENA.addEventListener("click", e => {
            if (document.body.classList.toggle("hide-not-on-arena")) {
                HIDE_NOT_ARENA.title = "Show All Cards";
                HIDE_NOT_ARENA.innerText = "👁";
            } else {
                HIDE_NOT_ARENA.title = "Show Only Arena Cards";
                HIDE_NOT_ARENA.innerText = "🚫";
            }
        });
        let CONTAINER = document.querySelector("#BTN_CONTAINER");
        if (!CONTAINER) {
            CONTAINER = document.createElement("span");
            CONTAINER.id = "BTN_CONTAINER";
        }
        CONTAINER.innerHTML = "";
        CONTAINER.append(EXPORT_BUTTON)
        CONTAINER.append(HIDE_NOT_ARENA)

        const DECKLIST = document.createElement("section");
        DECKLIST.innerText = decklist;
        DECKLIST.classList.add("decklist", "shadow-sm")
        CONTAINER.append(DECKLIST)

        const NAVBAR = document.querySelector(".navbar-nav")
        NAVBAR.append(CONTAINER);
    });
}
parsePage();

async function writeTextToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
}
