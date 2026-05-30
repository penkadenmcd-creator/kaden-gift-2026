/*:
 * @plugindesc ADV向けボイス自動切替プラグイン v1.0
 * @author かでん / ChatGPT
 *
 * @help
 * ==================================================
 * VoiceControl.js
 * ==================================================
 *
 * ■概要
 * VoiceStart scene001
 * で開始。
 *
 * audio/se/voice/
 * 内の
 *
 * scene00101.ogg
 * scene00102.ogg
 * scene00103.ogg
 *
 * を \! ごとに順番再生します。
 *
 * ==================================================
 * ■使用方法
 * ==================================================
 *
 * ◆プラグインコマンド
 * VoiceStart scene001
 *
 * ◆文章
 * こんにちは。\!
 * 今日はいい天気だね。\!
 * 眠いな……
 *
 * ==================================================
 * ■仕様
 * ==================================================
 *
 * ・VoiceStart時に01再生
 * ・\!解除時に次再生
 * ・前の音声停止
 * ・存在しないファイルは無視
 * ・メッセージ終了時停止
 *
 */

/*:ja
 * @plugindesc ADV向けボイス自動切替プラグイン v1.0
 * @author かでん / ChatGPT
 *
 * @help
 * VoiceStart scene001
 * で開始。
 */

var Imported = Imported || {};
Imported.VoiceControl = true;

(function() {

var voiceBaseName = "";
var voiceIndex = 1;
var currentBuffer = null;
var pauseHandled = false;

function makeVoiceName(index) {
    return voiceBaseName + ("0" + index).slice(-2);
}

function stopVoice() {

    if (currentBuffer) {

        try {
            currentBuffer.stop();
        } catch (e) {
        }

        currentBuffer = null;
    }
}

function playVoice(index) {

    if (!voiceBaseName) {
        return;
    }

    var name = makeVoiceName(index);

    stopVoice();

    try {

        currentBuffer = AudioManager.createBuffer(
            "se/voice/",
            name
        );

        currentBuffer.play(false);

    } catch (e) {

        console.warn("VoiceControl: " + name);
    }
}

function playNextVoice() {

    voiceIndex++;
    playVoice(voiceIndex);
}

var _Game_Interpreter_pluginCommand =
    Game_Interpreter.prototype.pluginCommand;

Game_Interpreter.prototype.pluginCommand =
    function(command, args) {

    _Game_Interpreter_pluginCommand.call(this, command, args);

    if (command === "VoiceStart") {

        voiceBaseName = String(args[0] || "");
        voiceIndex = 1;

        playVoice(voiceIndex);
    }
};

var _Window_Message_updateInput =
    Window_Message.prototype.updateInput;

Window_Message.prototype.updateInput =
    function() {

    var wasPaused = this.pause;

    var result =
        _Window_Message_updateInput.call(this);

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

var _Window_Message_terminateMessage =
    Window_Message.prototype.terminateMessage;

Window_Message.prototype.terminateMessage =
    function() {

    stopVoice();

    _Window_Message_terminateMessage.call(this);
};

})();