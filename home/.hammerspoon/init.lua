local script_path = os.getenv("HOME") .. "/dot/bin/whisper-push-to-talk.sh"
local slash_key = hs.keycodes.map["/"]
local event_types = hs.eventtap.event.types
local raw_flag_masks = hs.eventtap.event.rawFlagMasks
local alert_style = {
  textSize = 18,
  radius = 10,
  padding = 12,
  fillColor = { white = 0, alpha = 0.75 },
  strokeColor = { white = 1, alpha = 0.15 },
  textColor = { white = 1 },
  fadeInDuration = 0.1,
  fadeOutDuration = 0.15,
}
local active_tasks = {}
local pressed_mode = nil
local recording = false
local recording_mode = nil
local start_pending = false
local stop_pending = false

local function trim(text)
  return (text or ""):gsub("^%s+", ""):gsub("%s+$", "")
end

local function notify(message)
  print("[Whisper Push-To-Talk] " .. message)
  hs.notify.new({
    title = "Whisper Push-To-Talk",
    informativeText = message,
  }):send()
  hs.alert.closeAll(0)
  hs.alert.show(message, alert_style, hs.screen.mainScreen(), 1.5)
end

local function task_finished(task)
  active_tasks[task] = nil
end

local function run_script(arguments, on_exit)
  local task

  task = hs.task.new(script_path, function(exit_code, std_out, std_err)
    task_finished(task)
    on_exit(exit_code, trim(std_out), trim(std_err))
  end, arguments)

  if not task then
    on_exit(1, "", "Failed to launch push-to-talk script.")
    return false
  end

  active_tasks[task] = true
  if not task:start() then
    task_finished(task)
    on_exit(1, "", "Failed to start push-to-talk script.")
    return false
  end

  return true
end

local function shortcut_mode(event)
  local flags = event:getFlags()
  local raw_flags = event:rawFlags()

  if (raw_flags & raw_flag_masks.deviceRightCommand) == 0 then
    return nil
  end

  if flags.ctrl or flags.shift or flags.fn or flags.capslock then
    return nil
  end

  if flags.alt then
    return "type"
  end

  return "copy"
end

local function mode_is_still_active(event, mode)
  local flags = event:getFlags()
  local raw_flags = event:rawFlags()

  if (raw_flags & raw_flag_masks.deviceRightCommand) == 0 then
    return false
  end

  if mode == "type" then
    return flags.alt
  end

  return true
end

local function stop_mode_argument(mode)
  if mode == "copy" then
    return "copy"
  end

  return "emit"
end

local function deliver_transcript(mode, transcript)
  if transcript == "" then
    return false, "Transcription returned empty text."
  end

  if mode == "type" then
    local app = hs.application.frontmostApplication()

    if app then
      hs.eventtap.keyStrokes(transcript, app)
    else
      hs.eventtap.keyStrokes(transcript)
    end

    return true, "Transcript typed into focused app."
  end

  return true, "Transcript copied to clipboard."
end

local function request_stop()
  if not recording or stop_pending or not recording_mode then
    return
  end

  local mode = recording_mode

  stop_pending = true
  notify("Transcribing audio...")
  run_script({ "stop", stop_mode_argument(mode) }, function(exit_code, std_out, std_err)
    stop_pending = false
    recording = false
    recording_mode = nil

    if exit_code == 0 then
      local ok, message = deliver_transcript(mode, std_out)
      notify(message)
      return
    end

    if exit_code ~= 3 then
      notify(std_err ~= "" and std_err or "Transcription failed.")
    end
  end)
end

local function start_recording(mode)
  if recording or start_pending or stop_pending then
    return
  end

  start_pending = true
  notify("Starting recorder...")
  run_script({ "start" }, function(exit_code, _, std_err)
    start_pending = false

    if exit_code == 0 then
      recording = true
      recording_mode = mode
      notify("Recording audio...")
      if pressed_mode == nil then
        request_stop()
      end
      return
    end

    if exit_code == 2 then
      recording = true
      recording_mode = recording_mode or mode
      if pressed_mode == nil then
        request_stop()
      end
      return
    end

    pressed_mode = nil
    notify(std_err ~= "" and std_err or "Recording failed to start.")
  end)
end

if not slash_key then
  notify("Slash key is unavailable in the current keyboard layout.")
  return
end

whisper_push_to_talk_tap = hs.eventtap.new({
  event_types.keyDown,
  event_types.keyUp,
  event_types.flagsChanged,
}, function(event)
  local event_type = event:getType()
  local key_code = event:getKeyCode()

  if event_type == event_types.keyDown and key_code == slash_key then
    local mode = shortcut_mode(event)

    if mode then
      pressed_mode = mode
      start_recording(mode)
      return true
    end
  end

  if event_type == event_types.keyUp and key_code == slash_key and pressed_mode ~= nil then
    pressed_mode = nil
    request_stop()
    return true
  end

  if event_type == event_types.flagsChanged and pressed_mode ~= nil and not mode_is_still_active(event, pressed_mode) then
    pressed_mode = nil
    request_stop()
  end

  return false
end):start()
