class word_card extends HTMLElement {
    constructor() {
        super();

        // var shadow = this.attachShadow({ mode: "closed" });

        var templateElem = document.querySelector("#word_card");
        var content = templateElem.content.cloneNode(true);
        var [word, phonetic, translation] = [
            this.getAttribute("word"),
            this.getAttribute("phonetic"),
            this.getAttribute("translation"),
        ];
        content.querySelector("#word").innerHTML = this.getAttribute("word");
        content.querySelector("#phonetic").innerHTML = this.getAttribute("phonetic");
        content.querySelector("#translation").innerHTML =
            to(this.getAttribute("translation")) +
            `<a href="https://www.dictionary.com/browse/${this.getAttribute(
                "word"
            )}" target="_blank" class="other_dic">dic</a> ` +
            `<a href="https://www.thesaurus.com//browse/${this.getAttribute(
                "word"
            )}" target="_blank" class="other_dic">dic</a>`;

        this.appendChild(content);

        io.observe(this.parentElement);

        var show = false;
        this.querySelector("#word-main").onclick = () => {
            // 只在列表模式下生效
            if (store["list"] && document.getSelection().toString() == "") {
                show = !show;
                if (show) {
                    this.s();
                    play(word);
                    syllable(word, this.querySelector("#word-main"));
                    word_more(word);
                } else {
                    this.s_h();
                }
            }
        };

        var value = this.getAttribute("value")
            .split(",")
            .map((v) => Number(v));
        function get_max_v(params, m) {
            for (let i in store.word_value) {
                let v = store.word_value[i]?.[params]?.v || 0;
                if (v > m) m = v;
            }
            return m;
        }
        function rgb(params, v) {
            document.documentElement.style.setProperty(`--value-max-${params}`, get_max_v(params, Number(v)));
            let x = `calc(255 - 255 * (${v} / var(--value-max-${params})))`;
            return `rgb(${x},${x},${x})`;
        }

        var new_el = (p) => {
            let k2v = { k: 0, s: 1 };
            let vv = value[k2v[p]];
            let html = `<button id="d"></button><span></span><button id="u"></button><input type="number" id="n"
            min="0" autocomplete="off">`;
            let el = document.createElement("div");
            el.id = "el";
            el.innerHTML = html;
            el.querySelector("input").value = el.querySelector("span").innerText = vv;
            el.style.background = rgb(p, vv);
            let k_input = () => {
                this.setAttribute("value", el.querySelector("input").value);
                el.querySelector("span").innerText = el.querySelector("input").value;
                el.style.background = rgb(p, el.querySelector("input").value);
                word_value_write(this.getAttribute("word"), p, Number(el.querySelector("input").value));
                setTimeout(() => {
                    this.focus();
                }, 100);
            };
            el.querySelector("input").oninput = k_input;
            el.querySelector("#d").onclick = () => {
                el.querySelector("input").stepDown();
                el.querySelector("span").innerText = el.querySelector("input").value;
                k_input();
            };
            el.querySelector("#u").onclick = () => {
                el.querySelector("input").stepUp();
                el.querySelector("span").innerText = el.querySelector("input").value;
                k_input();
            };
            return el;
        };

        this.querySelector("#tags").before(new_el("k"));
        this.querySelector("#tags").before(new_el("s"));

        if (!store.word_value[word]) store.word_value[word] = { tags: [] };
        if (!store.word_value[word].tags) store.word_value[word]["tags"] = [];
        for (let t of store.word_value[word].tags) {
            this.add_tags(t);
        }

        var tag_input = document.createElement("input");
        tag_input.type = "text";
        tag_input.setAttribute("list", "tags_list");
        tag_input.onchange = () => {
            if (tag_input.value == "") return;
            if (store.word_value[word].tags.includes(tag_input.value)) {
                tag_input.value = "";
                return;
            }
            store.word_value[word].tags.push(tag_input.value);
            if (!store?.tags) {
                store["tags"] = {};
            }
            if (!store.tags?.[tag_input.value]) {
                let t = confirm(`是否新建${tag_input.value}`);
                if (!t) {
                    tag_input.value = "";
                    return;
                }
            }
            store.tags[tag_input.value] = { color: "#000" };
            this.add_tags(tag_input.value);
            this.querySelector("#tags").append(tag_input);
            tag_input.value = "";
            tag_input.focus();
            tags_list();
            if (window.showOpenFilePicker && fileHandle) {
                download_store();
            }
        };
        this.querySelector("#tags").append(tag_input);
        this.querySelector("#tags").onclick = () => {
            tag_input.focus();
        };

        this.querySelector("#play_b").onclick = () => {
            play(word);
        };

        var spell = false;
        this.querySelector("#spell_b").onclick = () => {
            spell = !spell;
            if (mode) {
                if (spell) {
                    this.spell_s();
                } else {
                    this.spell_s_h();
                }
            }
        };
        var spellNum = document.getElementById("spellN").value - 0;
        this.querySelector("#spellWord").oninput = this.check = (v) => {
            var el = this.querySelector("#word_spell");
            var inputWord = el.querySelector("#spellWord").value;
            el.querySelector("#word").innerHTML = "";
            el.querySelector("#phonetic").innerHTML = "";
            switch (inputWord) {
                case "~": // 暂时展示
                    syllable(word, el);
                    el.querySelector("#word").style = "font-size: var(--word-s)";
                    el.querySelector("#phonetic").innerHTML = phonetic;
                    el.querySelector("#spellWord").value = "";
                    play(word);
                    break;
                case "!": // 发音
                    play(word);
                    el.querySelector("#spellWord").value = "";
                    break;
                case word: // 正确
                    if (spellNum == 1) {
                        inputWord = el.querySelector("#spellWord").value = "";
                        el.querySelector("#spellWord").placeholder = "ok";
                        if (!mode) {
                            console.log(this.getAttribute("n"));
                            next(this.getAttribute("n") - 0 + 1);
                        }
                        this.querySelectorAll("#el")[1].querySelector("#u").click();
                    } else {
                        spellNum--;
                        el.querySelector("#spellWord").value = "";
                        el.querySelector("#spellWord").placeholder = `Good! ${spellNum} time(s) left`;
                    }
                    break;
            }
            //错误归位
            if ((inputWord.length == word.length || v) && inputWord != word) {
                syllable(word, el);
                el.querySelector("#word").style = "font-size: var(--word-s)";
                el.querySelector("#phonetic").innerHTML = phonetic;
                spellNum = document.getElementById("spellN").value;
                el.querySelector("#spellWord").value = "";
                el.querySelector("#spellWord").placeholder = `"${inputWord}" is wrong! ${spellNum} time(s) left`;
                play(word);
            }
        };

        this.onpointerover = (e) => {
            if (e.pointerType == "pen" && spell) {
                console.log(1);
                document.getElementById("write").style.display = "block";
                document.getElementById("write_bar").style.display = "block";
                document.getElementById("write").width = document.getElementById("write").offsetWidth;
                document.getElementById("write").height = document.getElementById("write").offsetHeight;
                now_spell_word = word;
            }
        };

        var other = false;
        var time = null;
        this.querySelector("#other_b").onclick = () => {
            if (!spell) {
                other = !other;
                if (other) {
                    this.style.gridTemplateColumns = "0 1fr 0";
                    if (this.querySelector("iframe").src == location.href)
                        this.querySelector("iframe").src = "https://cn.bing.com/dict/search?q=" + word;
                    if (time) clearTimeout(time);
                } else {
                    this.style.gridTemplateColumns = "var(--not-spell)";
                    time = setTimeout(() => {
                        this.querySelector("iframe").src = "";
                    }, 60 * 1000);
                }
            }
        };
        this.onkeydown = (e) => {
            if (e.key == " ") {
                e.preventDefault();
                this.querySelector("#word-main").click();
            }
        };
    }

    add_tags = (t) => {
        let div = document.createElement("div");
        div.innerText = t;
        let button = document.createElement("button");
        button.onclick = () => {
            div.remove();
            store.word_value[word].tags = store.word_value[word].tags.filter((v) => v != t);
        };
        div.append(button);
        this.querySelector("#tags").append(div);
    };

    // 卡片
    s() {
        this.querySelector("#word").style.fontSize = "var(--word-s)";
        this.querySelector("#phonetic").style.fontSize = "var(--phonetic-s)";
        this.querySelector("#translation").style.fontSize = "var(--translation-s)";
        this.querySelector("#word").style.visibility = "visible";
        this.querySelector("#phonetic").style.visibility = "visible";
        this.querySelector("#translation").style.visibility = "visible";
        this.querySelector("#more").style.display = "";

        this.parentElement.parentElement.scrollTop = this.offsetTop - document.querySelector(".nav").offsetHeight;
    }

    // 列表
    s_h() {
        this.querySelector("#word").style.fontSize = "var(--word-s-h)";
        this.querySelectorAll(".syllable").forEach((e) => {
            if (e.style) {
                e.style.boxShadow = "0 0";
            }
        });
        this.querySelectorAll(".syllable_s").forEach((e) => {
            if (e.style) {
                e.style.width = "0";
            }
        });
        this.querySelector("#phonetic").style.fontSize = "var(--phonetic-s-h)";
        this.querySelector("#translation").style.fontSize = "var(--translation-s-h)";
        this.querySelector("#word").style.visibility = "";
        this.querySelector("#phonetic").style.visibility = "";
        this.querySelector("#translation").style.visibility = "";
        this.querySelector("#more").style.display = "none";
    }

    spell_s() {
        this.style.gridTemplateColumns = "0 0 1fr";
        this.querySelector("#word-main").style.height = "0";
        this.querySelector("#word_spell").querySelector("#translation").innerHTML = this.getAttribute("translation");
    }

    spell_s_h() {
        this.style.gridTemplateColumns = "var(--not-spell)";
        this.querySelector("#word-main").style.height = "var(--main-height)";
        this.querySelector("#word_spell").querySelector("#translation").innerHTML = "";
    }

    // 根据show属性切换
    set show(v) {
        this.setAttribute("show", v);
        can_record_p = false;
        if (v) {
            this.s();
        } else {
            this.s_h();
        }
        setTimeout(() => {
            can_record_p = true;
        }, 1000);
    }

    set spell(v) {
        this.setAttribute("spell", v);
        can_record_p = false;
        if (v) {
            this.spell_s();
        } else {
            this.spell_s_h();
        }
        can_record_p = true;
    }

    get n() {
        return this.getAttribute("n");
    }
}

window.customElements.define("word-card", word_card);
