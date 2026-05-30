/*:
 * @target MV MZ
 * @plugindesc ADV Voice Control FIX - セッション分離版 v2.0
 * @author ChatGPT
 */

(() => {

    const VOICE_FOLDER = "se/voice/";

    //==================================================
    // インタープリタ単位で管理（重要）
    //==================================================

    const _Game_Interpreter_init = Game_Interpreter.prototype.initialize;
    Game_Interpreter.prototype.initialize = function() {
        _Game_Interpreter_init.call(this);

        this._voiceBase = "";
        this._voiceIndex = 1;
        this._voiceBuffer = null;
        this._voicePaused = false;
        this._voiceActive = false;
    };

    //==================================================
    // 共通処理
    //==================================================

    function stopVoice(interpreter) {
        if (interpreter._voiceBuffer) {
            try {
                interpreter._voiceBuffer.stop();
            } catch (e) {}
            interpreter._voiceBuffer = null;
        }
    }

    function makeName(base, index) {
        return base + String(index).padStart(2, "0");
    }

    function playVoice(interpreter, index) {

        if (!interpreter._voiceBase) return;

        const name = makeName(interpreter._voiceBase, index);

        stopVoice(interpreter);

        try {
            interpreter._voiceBuffer = AudioManager.createBuffer(
                VOICE_FOLDER,
                name
            );
            interpreter._voiceBuffer.play(false);
        } catch (e) {
            console.warn("Voice missing: " + name);
        }
    }

    //==================================================
    // コマンド
    //==================================================

    const _pluginCommand = Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand = function(command, args) {

        _pluginCommand.call(this, command, args);

        if (command === "VoiceStart") {

            this._voiceBase = String(args[0] || "");
            this._voiceIndex = 1;
            this._voiceActive = true;

            playVoice(this, 1);
        }

        if (command === "VoiceStop") {

            this._voiceActive = false;
            this._voiceBase = "";
            this._voiceIndex = 1;

            stopVoice(this);
        }
    };

    //==================================================
    // \!検知（イベント単位）
    //==================================================

    const _updateInput = Window_Message.prototype.updateInput;

    Window_Message.prototype.updateInput = function() {

        const wasPaused = this.pause;
        const result = _updateInput.call(this);

        const interpreter = $gameMap._interpreter;

        if (!interpreter || !interpreter._voiceActive) {
            return result;
        }

        if (wasPaused && !this.pause) {

            if (!interpreter._voicePaused) {
                interpreter._voicePaused = true;

                interpreter._voiceIndex++;
                playVoice(interpreter, interpreter._voiceIndex);
            }

        } else {
            interpreter._voicePaused = false;
        }

        return result;
    };

    //==================================================
    // メッセージ終了
    //==================================================

    const _terminate = Window_Message.prototype.terminateMessage;

    Window_Message.prototype.terminateMessage = function() {

        const interpreter = $gameMap._interpreter;

        if (interpreter) {
            interpreter._voiceActive = false;
            stopVoice(interpreter);
        }

        _terminate.call(this);
    };

})();