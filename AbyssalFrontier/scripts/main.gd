extends Node3D

const ResourceNodeScript = preload("res://scripts/resource_node.gd")
const FaunaScript = preload("res://scripts/fauna.gd")

var rng := RandomNumberGenerator.new()

func _ready() -> void:
    rng.randomize()
    _create_environment()
    _create_seabed()
    _create_starting_habitat()
    _scatter_resources()
    _spawn_fauna()

func _create_environment() -> void:
    var world := WorldEnvironment.new()
    var env := Environment.new()
    env.background_mode = Environment.BG_COLOR
    env.background_color = Color(0.012, 0.075, 0.11)
    env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
    env.ambient_light_color = Color(0.22, 0.58, 0.63)
    env.ambient_light_energy = 0.72
    env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
    env.fog_enabled = true
    env.fog_light_color = Color(0.025, 0.22, 0.26)
    env.fog_density = 0.006
    world.environment = env
    add_child(world)

    var sunlight := DirectionalLight3D.new()
    sunlight.rotation_degrees = Vector3(-58.0, 24.0, 0.0)
    sunlight.light_color = Color(0.48, 0.82, 0.83)
    sunlight.light_energy = 0.85
    sunlight.shadow_enabled = true
    add_child(sunlight)

func _create_seabed() -> void:
    var floor := MeshInstance3D.new()
    var plane := PlaneMesh.new()
    plane.size = Vector2(220.0, 220.0)
    floor.mesh = plane
    floor.position = Vector3(0.0, -25.0, 0.0)
    var mat := StandardMaterial3D.new()
    mat.albedo_color = Color(0.045, 0.13, 0.14)
    mat.roughness = 1.0
    floor.material_override = mat
    add_child(floor)

    # Large, rounded rock formations make a navigable original starting biome.
    for i in range(34):
        var rock := MeshInstance3D.new()
        var sphere := SphereMesh.new()
        var radius := rng.randf_range(1.0, 3.8)
        sphere.radius = radius
        sphere.height = radius * 1.7
        rock.mesh = sphere
        rock.position = Vector3(rng.randf_range(-78.0, 78.0), -24.0 + radius * 0.25, rng.randf_range(-78.0, 78.0))
        rock.scale = Vector3(rng.randf_range(0.8, 1.7), rng.randf_range(0.45, 0.9), rng.randf_range(0.8, 1.5))
        var rock_mat := StandardMaterial3D.new()
        rock_mat.albedo_color = Color(0.055, 0.17, 0.18).lerp(Color(0.13, 0.23, 0.2), rng.randf())
        rock_mat.roughness = 0.95
        rock.material_override = rock_mat
        add_child(rock)

    # Glowing coral clusters provide landmarks without external art assets.
    for i in range(26):
        var coral := Node3D.new()
        coral.position = Vector3(rng.randf_range(-65.0, 65.0), rng.randf_range(-21.5, -16.0), rng.randf_range(-65.0, 65.0))
        add_child(coral)
        var hue := rng.randf_range(0.42, 0.62)
        var glow_color := Color.from_hsv(hue, 0.72, 0.95)
        for branch in range(3):
            var stem := MeshInstance3D.new()
            var cylinder := CylinderMesh.new()
            cylinder.top_radius = 0.08
            cylinder.bottom_radius = 0.2
            cylinder.height = rng.randf_range(1.0, 2.5)
            stem.mesh = cylinder
            stem.position = Vector3(rng.randf_range(-0.5, 0.5), cylinder.height * 0.5, rng.randf_range(-0.5, 0.5))
            stem.rotation_degrees = Vector3(rng.randf_range(-12.0, 12.0), 0.0, rng.randf_range(-24.0, 24.0))
            var coral_mat := StandardMaterial3D.new()
            coral_mat.albedo_color = glow_color
            coral_mat.emission_enabled = true
            coral_mat.emission = glow_color * 0.55
            stem.material_override = coral_mat
            coral.add_child(stem)

func _create_starting_habitat() -> void:
    var habitat := Node3D.new()
    habitat.name = "Tideglass Shelter"
    habitat.position = Vector3(0.0, -4.0, 0.0)
    add_child(habitat)

    var platform := MeshInstance3D.new()
    var platform_mesh := CylinderMesh.new()
    platform_mesh.top_radius = 4.7
    platform_mesh.bottom_radius = 4.7
    platform_mesh.height = 0.45
    platform.mesh = platform_mesh
    var metal := StandardMaterial3D.new()
    metal.albedo_color = Color(0.12, 0.24, 0.27)
    metal.metallic = 0.55
    metal.roughness = 0.42
    platform.material_override = metal
    platform.position = Vector3(0.0, -2.0, 0.0)
    habitat.add_child(platform)

    var core := MeshInstance3D.new()
    var core_mesh := SphereMesh.new()
    core_mesh.radius = 1.65
    core_mesh.height = 3.3
    core.mesh = core_mesh
    var glass := StandardMaterial3D.new()
    glass.albedo_color = Color(0.14, 0.54, 0.59, 0.72)
    glass.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
    glass.metallic = 0.25
    glass.roughness = 0.18
    core.material_override = glass
    core.position = Vector3(0.0, -0.05, 0.0)
    habitat.add_child(core)

    var beacon := OmniLight3D.new()
    beacon.position = Vector3(0.0, 1.5, 0.0)
    beacon.light_color = Color(0.2, 0.95, 0.82)
    beacon.light_energy = 2.2
    beacon.omni_range = 15.0
    habitat.add_child(beacon)

    var sign_mesh := MeshInstance3D.new()
    var sign_box := BoxMesh.new()
    sign_box.size = Vector3(1.8, 0.7, 0.12)
    sign_mesh.mesh = sign_box
    sign_mesh.position = Vector3(0.0, 2.15, -1.6)
    var sign_mat := StandardMaterial3D.new()
    sign_mat.albedo_color = Color(0.06, 0.35, 0.34)
    sign_mat.emission_enabled = true
    sign_mat.emission = Color(0.08, 0.5, 0.42)
    sign_mesh.material_override = sign_mat
    habitat.add_child(sign_mesh)

func _scatter_resources() -> void:
    var definitions := [
        {"name": "Lumen Shard", "color": Color(0.15, 0.95, 0.82)},
        {"name": "Kelp Fiber", "color": Color(0.42, 0.86, 0.28)},
        {"name": "Thermal Ore", "color": Color(1.0, 0.48, 0.16)}
    ]
    for i in range(42):
        var definition: Dictionary = definitions[i % definitions.size()]
        var node = ResourceNodeScript.new()
        node.item_name = definition["name"]
        node.tint = definition["color"]
        var angle := rng.randf_range(0.0, TAU)
        var distance := rng.randf_range(13.0, 52.0)
        node.position = Vector3(cos(angle) * distance, rng.randf_range(-21.0, -2.0), sin(angle) * distance)
        add_child(node)

func _spawn_fauna() -> void:
    for i in range(7):
        var creature = FaunaScript.new()
        creature.position = Vector3(rng.randf_range(-42.0, 42.0), rng.randf_range(-15.0, -3.0), rng.randf_range(-42.0, 42.0))
        creature.phase = rng.randf_range(0.0, TAU)
        add_child(creature)
