extends Node3D

# Portal Nova is an original first-person puzzle prototype.
# All geometry and visuals are generated procedurally.

const BLUE_PORTAL := Color(0.08, 0.62, 1.0)
const ORANGE_PORTAL := Color(1.0, 0.34, 0.07)
const WALL_COLOR := Color(0.70, 0.78, 0.88)
const DARK_COLOR := Color(0.045, 0.065, 0.10)

var player: CharacterBody3D
var camera: Camera3D
var hud_title: Label
var hud_help: Label
var hud_status: Label
var level_root: Node3D
var cube: RigidBody3D
var exit_area: Area3D
var portals: Array[Dictionary] = [{}, {}]
var current_level: int = 0
var mouse_locked: bool = false
var can_portal_travel: bool = true
var carrying_cube: bool = false
var message_timer: float = 0.0

const LEVEL_NAMES := [
    "CHAMBER 01  /  FIRST CONTACT",
    "CHAMBER 02  /  MOMENTUM",
    "CHAMBER 03  /  ENERGY TRANSFER"
]
const LEVEL_HINTS := [
    "Place both portals on a surface, then walk into either portal.",
    "Use portals to cross the chamber and reach the exit platform.",
    "Press E near the energy cube, then carry it to the receiver."
]

func _ready() -> void:
    _setup_input()
    _build_player()
    _build_hud()
    _build_level()
    Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

func _setup_input() -> void:
    _add_key_action("move_forward", KEY_W)
    _add_key_action("move_back", KEY_S)
    _add_key_action("move_left", KEY_A)
    _add_key_action("move_right", KEY_D)
    _add_key_action("jump", KEY_SPACE)
    _add_key_action("interact", KEY_E)
    _add_key_action("restart", KEY_R)

func _add_key_action(action_name: String, key: Key) -> void:
    if not InputMap.has_action(action_name):
        InputMap.add_action(action_name)
    var event := InputEventKey.new()
    event.keycode = key
    InputMap.action_add_event(action_name, event)

func _build_player() -> void:
    player = CharacterBody3D.new()
    player.name = "Player"
    player.position = Vector3(0, 1.1, 1.5)

    var body_shape := CollisionShape3D.new()
    var capsule := CapsuleShape3D.new()
    capsule.radius = 0.38
    capsule.height = 1.8
    body_shape.shape = capsule
    player.add_child(body_shape)

    camera = Camera3D.new()
    camera.position = Vector3(0, 0.62, 0)
    camera.fov = 88.0
    player.add_child(camera)
    add_child(player)

func _build_hud() -> void:
    var layer := CanvasLayer.new()
    layer.name = "HUD"

    hud_title = Label.new()
    hud_title.position = Vector2(26, 20)
    hud_title.add_theme_font_size_override("font_size", 23)
    hud_title.add_theme_color_override("font_color", Color(0.78, 0.92, 1.0))
    layer.add_child(hud_title)

    hud_help = Label.new()
    hud_help.position = Vector2(26, 58)
    hud_help.add_theme_font_size_override("font_size", 16)
    hud_help.add_theme_color_override("font_color", Color(0.82, 0.87, 0.94))
    layer.add_child(hud_help)

    var crosshair := Label.new()
    crosshair.text = "+"
    crosshair.position = Vector2(632, 342)
    crosshair.add_theme_font_size_override("font_size", 28)
    crosshair.add_theme_color_override("font_color", Color(0.9, 0.97, 1.0))
    layer.add_child(crosshair)

    hud_status = Label.new()
    hud_status.position = Vector2(26, 655)
    hud_status.add_theme_font_size_override("font_size", 18)
    hud_status.add_theme_color_override("font_color", Color(0.55, 0.88, 1.0))
    layer.add_child(hud_status)
    add_child(layer)
    _update_hud()

func _build_level() -> void:
    if is_instance_valid(level_root):
        level_root.queue_free()

    level_root = Node3D.new()
    level_root.name = "LevelGeometry"
    add_child(level_root)

    portals = [{}, {}]
    cube = null
    carrying_cube = false
    can_portal_travel = true

    _make_box("Floor", Vector3(0, -0.5, -14), Vector3(16, 1, 40), WALL_COLOR)
    _make_box("Ceiling", Vector3(0, 6.5, -14), Vector3(16, 1, 40), WALL_COLOR)
    _make_box("Left wall", Vector3(-8, 3, -14), Vector3(1, 7, 40), WALL_COLOR)
    _make_box("Right wall", Vector3(8, 3, -14), Vector3(1, 7, 40), WALL_COLOR)
    _make_box("Entry wall", Vector3(0, 3, 6), Vector3(16, 7, 1), WALL_COLOR)
    _make_box("Back wall", Vector3(0, 3, -34), Vector3(16, 7, 1), WALL_COLOR)

    _make_box("Blue portal panel", Vector3(-7.43, 2.55, -5), Vector3(0.12, 4.4, 3.4), Color(0.12, 0.32, 0.52))
    _make_box("Orange portal panel", Vector3(7.43, 2.55, -13), Vector3(0.12, 4.4, 3.4), Color(0.52, 0.25, 0.12))

    for i in range(3):
        var platform_z := -7.0 - float(i) * 6.0
        _make_box("Test platform %d" % (i + 1), Vector3(-2.0 + float(i) * 2.0, 0.35, platform_z), Vector3(2.4, 0.7, 2.4), Color(0.20, 0.29, 0.43))

    _make_box("Exit platform", Vector3(0, 0.1, -29), Vector3(3.6, 0.2, 3.0), Color(0.10, 0.55, 0.42))
    _make_exit()
    if current_level == 2:
        _make_cube_and_receiver()
    _make_lighting()
    _update_hud()

func _make_box(label_text: String, pos: Vector3, size: Vector3, color: Color) -> StaticBody3D:
    var body := StaticBody3D.new()
    body.name = label_text
    body.position = pos

    var visual := MeshInstance3D.new()
    var mesh := BoxMesh.new()
    mesh.size = size
    visual.mesh = mesh
    var material := StandardMaterial3D.new()
    material.albedo_color = color
    material.roughness = 0.78
    visual.material_override = material
    body.add_child(visual)

    var collision := CollisionShape3D.new()
    var box_shape := BoxShape3D.new()
    box_shape.size = size
    collision.shape = box_shape
    body.add_child(collision)

    level_root.add_child(body)
    return body

func _make_lighting() -> void:
    var sun := DirectionalLight3D.new()
    sun.rotation_degrees = Vector3(-48, -25, 0)
    sun.light_energy = 1.1
    level_root.add_child(sun)

    var fill := OmniLight3D.new()
    fill.position = Vector3(0, 5.5, -14)
    fill.light_color = Color(0.25, 0.58, 1.0)
    fill.light_energy = 2.1
    fill.omni_range = 28.0
    level_root.add_child(fill)

func _make_exit() -> void:
    exit_area = Area3D.new()
    exit_area.name = "ChamberExit"
    exit_area.position = Vector3(0, 1.35, -29)
    var area_shape := CollisionShape3D.new()
    var area_box := BoxShape3D.new()
    area_box.size = Vector3(3.2, 2.8, 3.0)
    area_shape.shape = area_box
    exit_area.add_child(area_shape)
    exit_area.body_entered.connect(_on_exit_body_entered)
    level_root.add_child(exit_area)

func _make_cube_and_receiver() -> void:
    _make_box("Cube receiver", Vector3(0, 0.22, -27), Vector3(1.8, 0.25, 1.8), Color(0.08, 0.48, 0.35))

    cube = RigidBody3D.new()
    cube.name = "EnergyCube"
    cube.position = Vector3(0, 1.0, -10)
    cube.mass = 1.0
    cube.freeze = true

    var visual := MeshInstance3D.new()
    var cube_mesh := BoxMesh.new()
    cube_mesh.size = Vector3(0.7, 0.7, 0.7)
    visual.mesh = cube_mesh
    var material := StandardMaterial3D.new()
    material.albedo_color = Color(0.12, 0.95, 0.62)
    material.emission_enabled = true
    material.emission = Color(0.04, 0.55, 0.28)
    visual.material_override = material
    cube.add_child(visual)

    var collision := CollisionShape3D.new()
    var cube_shape := BoxShape3D.new()
    cube_shape.size = cube_mesh.size
    collision.shape = cube_shape
    cube.add_child(collision)
    level_root.add_child(cube)

func _physics_process(delta: float) -> void:
    if not is_instance_valid(player):
        return

    var move_input := Vector2(
        Input.get_action_strength("move_right") - Input.get_action_strength("move_left"),
        Input.get_action_strength("move_back") - Input.get_action_strength("move_forward")
    )
    var direction := (player.global_transform.basis * Vector3(move_input.x, 0, move_input.y)).normalized()

    player.velocity.x = direction.x * 6.5
    player.velocity.z = direction.z * 6.5
    if player.is_on_floor():
        player.velocity.y = 6.2 if Input.is_action_just_pressed("jump") else -0.15
    else:
        player.velocity.y -= 18.0 * delta

    player.move_and_slide()
    _check_portal_travel()

    if carrying_cube and is_instance_valid(cube):
        cube.global_position = camera.global_position - camera.global_basis.z * 1.55
        cube.global_rotation = camera.global_rotation

    if message_timer > 0.0:
        message_timer -= delta
        if message_timer <= 0.0:
            hud_status.text = ""

func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventMouseButton and event.pressed:
        if not mouse_locked:
            mouse_locked = true
            Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
            return
        if event.button_index == MOUSE_BUTTON_LEFT:
            _place_portal(BLUE_PORTAL, 0)
        elif event.button_index == MOUSE_BUTTON_RIGHT:
            _place_portal(ORANGE_PORTAL, 1)

    if event is InputEventMouseMotion and mouse_locked:
        player.rotate_y(-event.relative.x * 0.002)
        camera.rotate_x(-event.relative.y * 0.002)
        camera.rotation.x = clamp(camera.rotation.x, -1.45, 1.45)

    if event.is_action_pressed("ui_cancel"):
        mouse_locked = false
        Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

    if event.is_action_pressed("interact") and current_level == 2 and is_instance_valid(cube):
        if carrying_cube:
            carrying_cube = false
            cube.freeze = false
            _show_message("Energy cube released")
        elif cube.global_position.distance_to(player.global_position) < 2.8:
            carrying_cube = true
            cube.freeze = true
            _show_message("Energy cube picked up")

    if event.is_action_pressed("restart"):
        player.global_position = Vector3(0, 1.1, 1.5)
        player.velocity = Vector3.ZERO
        _show_message("Chamber reset")

func _place_portal(portal_color: Color, portal_index: int) -> void:
    var ray_start := camera.global_position
    var ray_end := ray_start + (-camera.global_basis.z * 45.0)
    var query := PhysicsRayQueryParameters3D.create(ray_start, ray_end)
    query.exclude = [player.get_rid()]
    var hit := get_world_3d().direct_space_state.intersect_ray(query)

    if hit.is_empty():
        _show_message("Aim at a solid chamber surface")
        return

    var surface_normal: Vector3 = hit.normal
    var surface_position: Vector3 = hit.position + surface_normal * 0.04
    portals[portal_index] = {
        "position": surface_position,
        "normal": surface_normal,
        "color": portal_color
    }
    _draw_portal(portal_index)
    _show_message("Blue portal linked" if portal_index == 0 else "Orange portal linked")

func _draw_portal(portal_index: int) -> void:
    var portal_data: Dictionary = portals[portal_index]
    var portal_node := Node3D.new()
    portal_node.name = "PortalVisual_%d" % portal_index
    portal_node.position = portal_data.position
    portal_node.look_at(portal_data.position + portal_data.normal, Vector3.UP)

    var portal_mesh := MeshInstance3D.new()
    var quad := QuadMesh.new()
    quad.size = Vector2(1.25, 2.45)
    portal_mesh.mesh = quad
    var material := StandardMaterial3D.new()
    material.albedo_color = portal_data.color
    material.emission_enabled = true
    material.emission = portal_data.color
    material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
    material.cull_mode = BaseMaterial3D.CULL_DISABLED
    portal_mesh.material_override = material
    portal_node.add_child(portal_mesh)

    var ring := MeshInstance3D.new()
    var torus := TorusMesh.new()
    torus.inner_radius = 0.59
    torus.outer_radius = 0.68
    ring.mesh = torus
    ring.material_override = material
    ring.rotation_degrees = Vector3(90, 0, 0)
    portal_node.add_child(ring)

    level_root.add_child(portal_node)

func _check_portal_travel() -> void:
    if not can_portal_travel or portals[0].is_empty() or portals[1].is_empty():
        return

    for index in range(2):
        var entry: Dictionary = portals[index]
        var distance := player.global_position.distance_to(entry.position)
        if distance < 0.95:
            var destination: Dictionary = portals[1 - index]
            player.global_position = destination.position + destination.normal * 1.7 + Vector3.UP * 0.15
            var launch_speed := maxf(player.velocity.length(), 5.5)
            player.velocity = destination.normal * launch_speed
            can_portal_travel = false
            get_tree().create_timer(0.55).timeout.connect(_enable_portal_travel)
            _show_message("PORTAL TRANSIT")
            return

func _enable_portal_travel() -> void:
    can_portal_travel = true

func _on_exit_body_entered(body: Node3D) -> void:
    if body != player:
        return
    if current_level == 2 and not carrying_cube:
        _show_message("Bring the energy cube to the receiver first")
        return
    _complete_level()

func _complete_level() -> void:
    if current_level < 2:
        current_level += 1
        player.global_position = Vector3(0, 1.1, 1.5)
        player.velocity = Vector3.ZERO
        _build_level()
        _show_message("CHAMBER COMPLETE")
    else:
        _show_message("CAMPAIGN COMPLETE  /  YOU ARE THE NOVA")
        hud_title.text = "PORTAL NOVA  /  CAMPAIGN COMPLETE"
        hud_help.text = "Press R to replay the current chamber"

func _update_hud() -> void:
    hud_title.text = "PORTAL NOVA  /  " + LEVEL_NAMES[current_level]
    hud_help.text = "WASD move  |  SPACE jump  |  Left click BLUE  |  Right click ORANGE  |  E cube  |  ESC cursor  |  R reset"
    if current_level < LEVEL_HINTS.size():
        hud_status.text = LEVEL_HINTS[current_level]

func _show_message(message: String) -> void:
    hud_status.text = message
    message_timer = 3.0
