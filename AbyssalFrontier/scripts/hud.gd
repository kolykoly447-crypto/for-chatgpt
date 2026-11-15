extends CanvasLayer

var player: Node
var oxygen_label: Label
var inventory_label: Label
var zone_label: Label
var message_label: Label
var message_time: float = 0.0

func _ready() -> void:
    player = get_parent().get_node("Player")
    _build_ui()

func _process(delta: float) -> void:
    if player == null:
        return
    var oxygen_value: float = player.oxygen
    oxygen_label.text = "OXYGEN  %3d / 100" % int(oxygen_value)
    var inventory: Dictionary = player.inventory
    var parts := PackedStringArray()
    for item in ["Lumen Shard", "Kelp Fiber", "Thermal Ore", "Oxygen Cell"]:
        var count := int(inventory.get(item, 0))
        if count > 0:
            parts.append("%s: %d" % [item, count])
    inventory_label.text = "PACK  " + ("   |   ".join(parts) if not parts.is_empty() else "empty")
    if player.global_position.distance_to(Vector3(0.0, -4.0, 0.0)) <= 10.0:
        zone_label.text = "TIDEGLASS SHELTER  •  OXYGEN RECHARGE"
    else:
        zone_label.text = "OPEN WATER  •  OXYGEN DEPLETING"
    if message_time > 0.0:
        message_time -= delta
        if message_time <= 0.0:
            message_label.text = ""

func _build_ui() -> void:
    var panel := PanelContainer.new()
    panel.position = Vector2(18.0, 18.0)
    panel.custom_minimum_size = Vector2(390.0, 142.0)
    add_child(panel)

    var stack := VBoxContainer.new()
    stack.add_theme_constant_override("separation", 7)
    panel.add_child(stack)

    var title := Label.new()
    title.text = "ABYSSAL FRONTIER"
    title.add_theme_font_size_override("font_size", 22)
    stack.add_child(title)

    oxygen_label = Label.new()
    oxygen_label.add_theme_font_size_override("font_size", 17)
    stack.add_child(oxygen_label)

    zone_label = Label.new()
    stack.add_child(zone_label)

    inventory_label = Label.new()
    inventory_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    stack.add_child(inventory_label)

    var crosshair := Label.new()
    crosshair.text = "+"
    crosshair.add_theme_font_size_override("font_size", 25)
    crosshair.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    crosshair.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
    crosshair.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
    crosshair.position = Vector2(-10.0, -15.0)
    add_child(crosshair)

    var help := Label.new()
    help.text = "WASD swim  •  SPACE / X rise / dive  •  SHIFT boost  •  E collect\nC craft oxygen cell  •  R use cell  •  B deploy beacon  •  ESC release mouse"
    help.position = Vector2(18.0, 646.0)
    help.add_theme_font_size_override("font_size", 14)
    add_child(help)

    message_label = Label.new()
    message_label.position = Vector2(420.0, 575.0)
    message_label.custom_minimum_size = Vector2(440.0, 42.0)
    message_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    message_label.add_theme_font_size_override("font_size", 18)
    add_child(message_label)

func show_message(message: String) -> void:
    message_label.text = message
    message_time = 3.5
