/*:
 * @plugindesc ADVボイス統合管理プラグイン (MV専用修正版)
 * @author かでん / ChatGPT / Gemini
 *
 * @help
 * 既存の audio/se/voice/ フォルダを使用します。
 * * ■ 自動再生機能
 * プラグインコマンド: VoiceStart scene001
 * メッセージ内の \! ごとに scene00101, scene00102... を自動再生します。
 * * ■ 手動再生機能
 * プラグインコマンド: playVoice No1_01,90,100,0
 * (※ voice/ は書かずにファイル名だけ書いてください)
 * * ■ 停止機能
 * プラグインコマンド: stopVoice
 * (※ voiceフォルダの音だけを狙って止めます)
 */

(function() {
    var voiceBaseName = "";
    var voiceIndex = 1;

    // ボイス停止処理（共通：決定音などは消さない）
    function stopVoice() {
        AudioManager._seBuffers.forEach(function(buffer) {
            if (buffer.url && (buffer.url.contains('voice%2F') || buffer.url.contains('voice/'))) {
                buffer.stop();
            }
        });
    }

    // ボイス再生処理（共通：%2Fエラーを回避する標準的な再生方式）
    function playVoiceInternal(fileName, volume, pitch, pan) {
        stopVoice();
        if (!fileName) return;

        AudioManager.playSe({
            name: "voice/" + fileName,
            volume: volume || 90,
            pitch: pitch || 100,
            pan: pan || 0
        });
    }

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);

        // 自動再生の開始
        if (command === "VoiceStart") {
            voiceBaseName = String(args[0] || "");
            voiceIndex = 1;
            playVoiceInternal(voiceBaseName + "01");
        }

        // 手動再生（playVoice ファイル名,音量,ピッチ,位相）
        if (command === 'playVoice') {
            var fullArg = args.join(' ');
            var data = fullArg ? fullArg.split(',') : [];
            var fileName = data[0] ? data[0].trim() : "";
            if (fileName) {
                playVoiceInternal(fileName, Number(data[1]), Number(data[2]), Number(data[3]));
            }
        }

        // 手動停止
        if (command === 'stopVoice') {
            stopVoice();
        }
    };

    // メッセージの \! 送り時の処理
    var _Window_Message_updateInput = Window_Message.prototype.updateInput;
    Window_Message.prototype.updateInput = function() {
        var wasPaused = this.pause;
        var result = _Window_Message_updateInput.call(this);
        if (wasPaused && !this.pause && voiceBaseName) {
            voiceIndex++;
            var nextVoice = voiceBaseName + ("0" + voiceIndex).slice(-2);
            playVoiceInternal(nextVoice);
        }
        return result;
    };

    // メッセージ終了時の停止
    var _Window_Message_terminateMessage = Window_Message.prototype.terminateMessage;
    Window_Message.prototype.terminateMessage = function() {
        stopVoice();
        _Window_Message_terminateMessage.call(this);
    };

})();