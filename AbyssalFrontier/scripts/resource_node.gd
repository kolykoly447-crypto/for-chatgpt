extends StaticBody3D

@export var item_name: String = "Lumen Shard"
@export var tint: Color = Color(0.15, 0.95, 0.82)

func _ready() -> void:
    collision_layer = 1
    collision_mask = 1

    var visual := MeshInstance3D.new()
    var crystal := SphereMesh.new()
    crystal.radius = 0.62
    crystal.height = 1.35
    visual.mesh = crystal
    var material := StandardMaterial3D.new()
    material.albedo_color = tint
    material.emission_enabled = true
    material.emission = tint * 0.65
    material.metallic = 0.18
    material.roughness = 0.28
    visual.material_override = material
    add_child(visual)

    var collision := CollisionShape3D.new()
    var sphere := SphereShape3D.new()
    sphere.radius = 1.0
    collision.shape = sphere
    add_child(collision)

func interact(player: Node) -> void:
    if player.has_method("add_item"):
        player.add_item(item_name, 1)
        queue_free()
