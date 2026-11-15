extends CharacterBody3D

@export var swim_speed: float = 7.0
@export var sprint_multiplier: float = 1.55
@export var oxygen_max: float = 100.0

var oxygen: float = 100.0
var inventory: Dictionary = {}
var mouse_sensitivity: float = 0.0023
var _camera: Camera3D

func _ready() -> void:
    _camera = get_node("Camera3D")
    Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
        rotate_y(-event.relative.x * mouse_sensitivity)
        _camera.rotate_x(-event.relative.y * mouse_sensitivity)
        _camera.rotation.x = clampf(_camera.rotation.x, deg_to_rad(-83.0), deg_to_rad(83.0))

    if event is InputEventKey and event.pressed and not event.echo:
        match event.keycode:
            KEY_ESCAPE:
                Input.mouse_mode = Input.MOUSE_MODE_VISIBLE if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED else Input.MOUSE_MODE_CAPTURED
            KEY_E:
                _interact()
            KEY_C:
                craft_oxygen_cell()
            KEY_R:
                use_oxygen_cell()
            KEY_B:
                place_beacon()

func _physics_process(delta: float) -> void:
    var input_vector := Vector3.ZERO
    var forward := -global_transform.basis.z
    var right := global_transform.basis.x

    if Input.is_key_pressed(KEY_W):
        input_vector += forward
    if Input.is_key_pressed(KEY_S):
        input_vector -= forward
    if Input.is_key_pressed(KEY_D):
        input_vector += right
    if Input.is_key_pressed(KEY_A):
        input_vector -= right
    if Input.is_key_pressed(KEY_SPACE):
        input_vector += Vector3.UP
    if Input.is_key_pressed(KEY_X):
        input_vector += Vector3.DOWN

    var current_speed := swim_speed
    if Input.is_key_pressed(KEY_SHIFT):
        current_speed *= sprint_multiplier
    if oxygen <= 0.0:
        current_speed *= 0.55

    if input_vector.length_squared() > 0.001:
        input_vector = input_vector.normalized()
    velocity = input_vector * current_speed
    move_and_slide()

    # The Tideglass Shelter has a safe oxygen-recharge bubble around it.
    var shelter_center := Vector3(0.0, -4.0, 0.0)
    if global_position.distance_to(shelter_center) <= 10.0:
        oxygen = minf(oxygen_max, oxygen + 18.0 * delta)
    else:
        oxygen = maxf(0.0, oxygen - 2.6 * delta)

func _interact() -> void:
    var ray_from := _camera.global_position
    var ray_to := ray_from + (-_camera.global_transform.basis.z * 5.5)
    var query := PhysicsRayQueryParameters3D.create(ray_from, ray_to)
    query.exclude = [get_rid()]
    var hit := get_world_3d().direct_space_state.intersect_ray(query)
    if hit.is_empty():
        notify("Nothing close enough to collect. Look at a glowing resource node.")
        return
    var target: Object = hit.get("collider")
    if target != null and target.has_method("interact"):
        target.interact(self)
    else:
        notify("This object cannot be collected.")

func add_item(item_name: String, amount: int = 1) -> void:
    inventory[item_name] = int(inventory.get(item_name, 0)) + amount
    notify("Collected %s x%d" % [item_name, amount])

func craft_oxygen_cell() -> void:
    if int(inventory.get("Lumen Shard", 0)) >= 3 and int(inventory.get("Kelp Fiber", 0)) >= 2:
        inventory["Lumen Shard"] -= 3
        inventory["Kelp Fiber"] -= 2
        inventory["Oxygen Cell"] = int(inventory.get("Oxygen Cell", 0)) + 1
        notify("Crafted an Oxygen Cell. Press R to use it.")
    else:
        notify("Oxygen Cell recipe: 3 Lumen Shards + 2 Kelp Fiber.")

func use_oxygen_cell() -> void:
    if int(inventory.get("Oxygen Cell", 0)) <= 0:
        notify("No Oxygen Cells. Craft one with C.")
        return
    inventory["Oxygen Cell"] -= 1
    oxygen = minf(oxygen_max, oxygen + 48.0)
    notify("Oxygen Cell used: oxygen restored.")

func place_beacon() -> void:
    if int(inventory.get("Thermal Ore", 0)) < 2 or int(inventory.get("Lumen Shard", 0)) < 1:
        notify("Beacon recipe: 2 Thermal Ore + 1 Lumen Shard.")
        return
    inventory["Thermal Ore"] -= 2
    inventory["Lumen Shard"] -= 1

    var beacon := Node3D.new()
    beacon.name = "Player Beacon"
    beacon.global_position = global_position
    var body := MeshInstance3D.new()
    var mesh := CylinderMesh.new()
    mesh.top_radius = 0.28
    mesh.bottom_radius = 0.42
    mesh.height = 1.2
    body.mesh = mesh
    var material := StandardMaterial3D.new()
    material.albedo_color = Color(0.12, 0.82, 0.72)
    material.emission_enabled = true
    material.emission = Color(0.08, 0.7, 0.56)
    body.material_override = material
    beacon.add_child(body)
    var light := OmniLight3D.new()
    light.position.y = 0.8
    light.light_color = Color(0.12, 1.0, 0.77)
    light.light_energy = 1.6
    light.omni_range = 11.0
    beacon.add_child(light)
    get_tree().current_scene.add_child(beacon)
    notify("Beacon deployed.")

func notify(message: String) -> void:
    var hud = get_node_or_null("../HUD")
    if hud != null and hud.has_method("show_message"):
        hud.show_message(message)
