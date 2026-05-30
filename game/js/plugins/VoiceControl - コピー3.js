/*:
 * @target MV MZ
 * @plugindesc ADV Voice Control - \vc方式 安定版 v3.0
 * @author ChatGPT
 *
 * @help
 * ==================================================
 * ■概要
 * ==================================================
 *
 * プラグインコマンド:
 *
 *   VoiceStart No1_
 *
 * を実行すると、
 *
 * audio/se/voice/
 *   No1_01.ogg
 *   No1_02.ogg
 *   No1_03.ogg
 *
 * を順番に再生します。
 *
 * ==================================================
 * ■使用方法
 * ==================================================
 *
 * ◆プラグインコマンド
 * VoiceStart No1_
 *
 * ◆文章
 * こんにちは。\!\vc
 * 今日はいい天気。\!\vc
 * 眠いな……
 *
 * ==================================================
 * ■重要
 * ==================================================
 *
 * ・\! は「待機専用」
 * ・\vc は「次のボイス再生専用」
 *
 * です。
 *
 * 以前のような
 * 「\!解除を監視して自動切替」
 * は行いません。
 *
 * ==================================================
 * ■動作
 * ==================================================
 *
 * ・VoiceStart時に01再生
 * ・\vc実行時に現在音声停止 → 次音声再生
 * ・存在しないファイルは無視
 * ・メッセージ終了時に停止
 *
 * ==================================================
 * ■音声配置
 * ==================================================
 *
 * audio/se/voice/
 *
 */

(() => {

    const VOICE_FOLDER = "se/voice/";

    let voiceBaseName = "";
    let voiceIndex = 1;
    let currentBuffer = null;

    //==================================================
    // ファイル名生成
    //==================================================

    function makeVoiceName(index) {
        return voiceBaseName + String(index).padStart(2, "0");
    }

    //==================================================
    // 停止
    //==================================================

    function stopVoice() {

        if (currentBuffer) {

            try {
                currentBuffer.stop();
            } catch (e) {
            }

            currentBuffer = null;
        }
    }

    //==================================================
    // 再生
    //==================================================

    function playVoice(index) {

        if (!voiceBaseName) {
            return;
        }

        const name = makeVoiceName(index);

        stopVoice();

        try {

            currentBuffer = AudioManager.createBuffer(
                VOICE_FOLDER,
                name
            );

            currentBuffer.play(false);

        } catch (e) {

            console.warn("VoiceControl: missing " + name);
        }
    }

    //==================================================
    // 次再生
    //==================================================

    function playNextVoice() {

        voiceIndex++;
        playVoice(voiceIndex);
    }

    //==================================================
    // プラグインコマンド
    //==================================================

    const _pluginCommand =
        Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand =
        function(command, args) {

        _pluginCommand.call(this, command, args);

        if (command === "VoiceStart") {

            voiceBaseName = String(args[0] || "");
            voiceIndex = 1;

            playVoice(voiceIndex);
        }

        if (command === "VoiceStop") {

            stopVoice();

            voiceBaseName = "";
            voiceIndex = 1;
        }
    };

    //==================================================
    // \vc 制御文字
    //==================================================

    const _processEscapeCharacter =
        Window_Base.prototype.processEscapeCharacter;

    Window_Base.prototype.processEscapeCharacter =
        function(code, textState) {

        if (code === "VC") {

            playNextVoice();
            return;
        }

        _processEscapeCharacter.call(
            this,
            code,
            textState
        );
    };

    //==================================================
    // メッセージ終了
    //==================================================

    const _terminateMessage =
        Window_Message.prototype.terminateMessage;

    Window_Message.prototype.terminateMessage =
        function() {

        stopVoice();

        voiceBaseName = "";
        voiceIndex = 1;

        _terminateMessage.call(this);
    };

})();