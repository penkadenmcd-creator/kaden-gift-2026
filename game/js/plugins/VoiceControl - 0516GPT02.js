/*:
 * @plugindesc ADV向けボイス自動切替プラグイン v1.1（セッション管理強化版）
 * @author かでん / ChatGPT
 *
 * @help
 * ==================================================
 * VoiceControl.js
 * ==================================================
 *
 * ■概要
 * VoiceStart [任意のプレフィックス]
 *
 * 例：
 *   VoiceStart No1_
 *   VoiceStart hero_
 *
 * audio/se/voice/
 * 内の
 *
 *   No1_01.ogg
 *   No1_02.ogg
 *   No1_03.ogg
 *
 * のような連番ファイルを
 * \! ごとに順番再生します。
 *
 * ==================================================
 * ■使用方法
 * ==================================================
 *
 * ◆プラグインコマンド（MV）
 * VoiceStart No1_
 *
 * ◆プラグインコマンド（MZ）
 * VoiceStart No1_
 *
 * ◆文章例
 * こんにちは。\!
 * 今日はいい天気だね。\!
 * 眠いな……
 *
 * ==================================================
 * ■仕様
 * ==================================================
 *
 * ・VoiceStart時に01を再生
 * ・\!解除時に次のボイスへ進行
 * ・前の音声は必ず停止
 * ・存在しないファイルは無視（エラー停止なし）
 * ・メッセージ終了時に必ず停止＆リセット
 * ・VoiceStart単位で完全にセッション分離
 *
 */

(() => {

    //==================================================
    // 内部状態（セッション管理）
    //==================================================

    let voiceBaseName = "";
    let voiceIndex = 1;
    let currentBuffer = null;

    // ★重要：セッション識別（No1_ / No2_問題対策）
    let currentSession = "";

    // \!連打・多重発火防止
    let pauseHandled = false;

    //==================================================
    // ユーティリティ
    //==================================================

    function makeVoiceName(index) {
        return voiceBaseName + String(index).padStart(2, "0");
    }

    function stopVoice() {
        if (currentBuffer) {
            try {
                currentBuffer.stop();
            } catch (e) {}
            currentBuffer = null;
        }
    }

    function playVoice(index) {

        // ★セッション外の再生を完全防止
        if (!voiceBaseName || voiceBaseName !== currentSession) return;

        const name = makeVoiceName(index);

        stopVoice();

        try {

            currentBuffer = AudioManager.createBuffer(
                "se/voice/",
                name
            );

            currentBuffer.play(false);

        } catch (e) {
            console.warn("VoiceControl: 再生失敗 " + name);
        }
    }

    function playNextVoice() {
        voiceIndex++;
        playVoice(voiceIndex);
    }

    //==================================================
    // プラグインコマンド（MV）
    //==================================================

    const _Game_Interpreter_pluginCommand =
        Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand = function(command, args) {

        _Game_Interpreter_pluginCommand.call(this, command, args);

        if (command === "VoiceStart") {

            const base = String(args[0] || "");

            voiceBaseName = base;
            currentSession = base;   // ★セッション開始
            voiceIndex = 1;

            playVoice(voiceIndex);
        }
    };

    //==================================================
    // MZ対応
    //==================================================

    if (Utils.RPGMAKER_NAME === "MZ") {

        PluginManager.registerCommand(
            document.currentScript.src.match(/([^\/]+)\.js$/)[1],
            "VoiceStart",
            args => {

                const base = String(args.name || "");

                voiceBaseName = base;
                currentSession = base;   // ★セッション開始
                voiceIndex = 1;

                playVoice(voiceIndex);
            }
        );
    }

    //==================================================
    // \!解除検知
    //==================================================

    const _Window_Message_updateInput =
        Window_Message.prototype.updateInput;

    Window_Message.prototype.updateInput = function() {

        const wasPaused = this.pause;

        const result = _Window_Message_updateInput.call(this);

        if (wasPaused && !this.pause) {

            if (!pauseHandled) {

                pauseHandled = true;

                playNextVoice();
            }

        } else {
            pauseHandled = false;
        }

        return result;
    };

    //==================================================
    // メッセージ終了時リセット（重要修正）
    //==================================================

    const _Window_Message_terminateMessage =
        Window_Message.prototype.terminateMessage;

    Window_Message.prototype.terminateMessage = function() {

        stopVoice();

        // ★完全リセット（No1_→No2_混線防止）
        voiceBaseName = "";
        currentSession = "";
        voiceIndex = 1;
        pauseHandled = false;

        _Window_Message_terminateMessage.call(this);
    };

})();