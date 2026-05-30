/*:
 * @target MV MZ
 * @plugindesc ADV Voice Control FIX - 変数制御対応版 v2.1
 * @author ChatGPT
 *
 * @help
 * ==================================================
 * ■概要
 * ==================================================
 *
 * プラグインコマンド:
 *
 * VoiceStart No1_
 * VoiceStop
 *
 * の形式で使用します。
 *
 * audio/se/voice/
 * にある
 *
 * No1_01.ogg
 * No1_02.ogg
 * No1_03.ogg
 *
 * を \! ごとに順番再生します。
 *
 * ==================================================
 * ■使用変数
 * ==================================================
 *
 * 変数0001:
 * VoiceControl有効フラグ
 * 0 = 無効
 * 1 = 有効
 *
 * 変数0002:
 * voiceIndex
 *
 * 変数0003:
 * pauseHandled
 * 0 = 未処理
 * 1 = 処理済み
 *
 * ==================================================
 * ■イベント例
 * ==================================================
 *
 * ◆変数0001 = 1
 * ◆変数0002 = 1
 * ◆変数0003 = 0
 *
 * ◆プラグインコマンド
 * VoiceStart No1_
 *
 * ◆文章
 * こんにちは。\!
 * 今日はいい天気
 *
 * ◆変数0001 = 0
 * ◆変数0002 = 1
 * ◆変数0003 = 0
 *
 * ==================================================
 */

(() => {

    const VOICE_FOLDER = "se/voice/";

    const VAR_ACTIVE = 1;
    const VAR_INDEX = 2;
    const VAR_PAUSE = 3;

    //==================================================
    // インタープリタ初期化
    //==================================================

    const _Game_Interpreter_init =
        Game_Interpreter.prototype.initialize;

    Game_Interpreter.prototype.initialize = function() {

        _Game_Interpreter_init.call(this);

        this._voiceBase = "";
        this._voiceBuffer = null;
    };

    //==================================================
    // 共通
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

        if (!interpreter._voiceBase) {
            return;
        }

        const name =
            makeName(interpreter._voiceBase, index);

        stopVoice(interpreter);

        try {

            interpreter._voiceBuffer =
                AudioManager.createBuffer(
                    VOICE_FOLDER,
                    name
                );

            interpreter._voiceBuffer.play(false);

        } catch (e) {

            console.warn(
                "Voice missing: " + name
            );
        }
    }

    //==================================================
    // プラグインコマンド
    //==================================================

    const _pluginCommand =
        Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand =
        function(command, args) {

        _pluginCommand.call(this, command, args);

        // -----------------------------
        // VoiceStart
        // -----------------------------

        if (command === "VoiceStart") {

            this._voiceBase =
                String(args[0] || "");

            $gameVariables.setValue(
                VAR_ACTIVE,
                1
            );

            $gameVariables.setValue(
                VAR_INDEX,
                1
            );

            $gameVariables.setValue(
                VAR_PAUSE,
                0
            );

            playVoice(this, 1);
        }

        // -----------------------------
        // VoiceStop
        // -----------------------------

        if (command === "VoiceStop") {

            stopVoice(this);

            this._voiceBase = "";

            $gameVariables.setValue(
                VAR_ACTIVE,
                0
            );

            $gameVariables.setValue(
                VAR_INDEX,
                1
            );

            $gameVariables.setValue(
                VAR_PAUSE,
                0
            );
        }
    };

    //==================================================
    // \!解除検知
    //==================================================

    const _updateInput =
        Window_Message.prototype.updateInput;

    Window_Message.prototype.updateInput =
        function() {

        const wasPaused = this.pause;

        const result =
            _updateInput.call(this);

        const interpreter =
            $gameMap._interpreter;

        if (!interpreter) {
            return result;
        }

        // 無効時
        if (
            $gameVariables.value(VAR_ACTIVE) !== 1
        ) {
            return result;
        }

        // \!解除
        if (wasPaused && !this.pause) {

            // 未処理なら実行
            if (
                $gameVariables.value(VAR_PAUSE) === 0
            ) {

                $gameVariables.setValue(
                    VAR_PAUSE,
                    1
                );

                let index =
                    $gameVariables.value(VAR_INDEX);

                index++;

                $gameVariables.setValue(
                    VAR_INDEX,
                    index
                );

                playVoice(interpreter, index);
            }

        } else {

            // 次回処理可能化
            $gameVariables.setValue(
                VAR_PAUSE,
                0
            );
        }

        return result;
    };

    //==================================================
    // メッセージ終了
    //==================================================

    const _terminate =
        Window_Message.prototype.terminateMessage;

    Window_Message.prototype.terminateMessage =
        function() {

        const interpreter =
            $gameMap._interpreter;

        if (interpreter) {

            stopVoice(interpreter);

            interpreter._voiceBase = "";
        }

        $gameVariables.setValue(
            VAR_ACTIVE,
            0
        );

        $gameVariables.setValue(
            VAR_INDEX,
            1
        );

        $gameVariables.setValue(
            VAR_PAUSE,
            0
        );

        _terminate.call(this);
    };

})();