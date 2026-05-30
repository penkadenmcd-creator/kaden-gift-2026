/*:
 * @target MV MZ
 * @plugindesc ADV Voice Control FINAL STABLE v7.4 (escape double-fire fix)
 * @author ChatGPT
 */

(() => {

    const VC_VERSION = "7.4";

    function log(msg) {
        console.log(`[VC v${VC_VERSION}] ${msg}`);
    }

    function makeName(base, index) {
        return base + String(index).padStart(2, "0");
    }

    function getVC() {
        const i = $gameMap._interpreter;
        return i ? i._vc : null;
    }

    function ensureVC(base) {
        const i = $gameMap._interpreter;
        if (!i) return null;

        if (!i._vc) {
            i._vc = {
                base: "",
                index: 1,
                waitingNext: false,
                audio: null,

                // ★追加：escape重複防止
                bangLocked: false
            };
        }

        if (base) i._vc.base = base;

        return i._vc;
    }

    function stop(vc) {
        if (!vc || !vc.audio) return;

        try {
            vc.audio.pause();
            vc.audio.currentTime = 0;
        } catch (e) {}

        vc.audio = null;
    }

    function play(vc, index) {

        if (!vc || !vc.base) return;

        const name = makeName(vc.base, index);

        log("PLAY : " + name);

        stop(vc);

        const audio = new Audio("audio/se/" + name + ".ogg");
        vc.audio = audio;

        audio.play()
            .then(() => log("PLAY START : " + name))
            .catch(() => log("MISSING : " + name));
    }

    function next(vc) {

        vc.index++;

        log("INDEX++ : " + vc.index);

        play(vc, vc.index);

        // ★解除（ここで再利用可能にする）
        vc.bangLocked = false;
    }

    //==================================================
    // VoiceStart
    //==================================================
    const _pluginCommand = Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand = function(command, args) {

        _pluginCommand.call(this, command, args);

        if (command === "VoiceStart") {

            const vc = ensureVC(args[0]);

            vc.index = 1;
            vc.waitingNext = false;
            vc.bangLocked = false;

            log("VoiceStart : " + vc.base);

            play(vc, 1);
        }
    };

    //==================================================
    // ★ \!（完全二重防止版）
    //==================================================
    const _processEscape = Window_Message.prototype.processEscapeCharacter;

    Window_Message.prototype.processEscapeCharacter = function(code, textState) {

        if (code === "!") {

            const vc = getVC();
            if (!vc) return;

            // ★ここが本体（1回しか通さない）
            if (vc.bangLocked) return;

            vc.bangLocked = true;
            vc.waitingNext = true;

            log("\\! DETECT");

            this.startPause();

            return;
        }

        _processEscape.call(this, code, textState);
    };

    //==================================================
    // update（1回だけ進行）
    //==================================================
    const _update = Window_Message.prototype.update;

    Window_Message.prototype.update = function() {

        const result = _update.call(this);

        const vc = getVC();

        if (!vc) return result;

        if (vc.waitingNext && !this.pause) {

            vc.waitingNext = false;

            log("RESUME DETECT");

            next(vc);
        }

        return result;
    };

    //==================================================
    // 終了処理
    //==================================================
    const _terminate = Window_Message.prototype.terminateMessage;

    Window_Message.prototype.terminateMessage = function() {

        log("MESSAGE END");

        const vc = getVC();

        if (vc && vc.audio) {
            try {
                vc.audio.pause();
                vc.audio.currentTime = 0;
            } catch (e) {}
        }

        _terminate.call(this);
    };

})();