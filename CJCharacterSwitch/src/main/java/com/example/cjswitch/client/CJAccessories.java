package com.example.cjswitch.client;

import com.example.cjswitch.CJCharacterSwitch;
import com.mojang.blaze3d.vertex.PoseStack;
import com.mojang.blaze3d.vertex.VertexConsumer;
import net.minecraft.client.model.PlayerModel;
import net.minecraft.client.model.geom.ModelLayerLocation;
import net.minecraft.client.model.geom.ModelPart;
import net.minecraft.client.model.geom.builders.CubeListBuilder;
import net.minecraft.client.model.geom.builders.LayerDefinition;
import net.minecraft.client.model.geom.builders.MeshDefinition;
import net.minecraft.client.model.geom.builders.PartDefinition;
import net.minecraft.client.model.geom.PartPose;
import net.minecraft.client.renderer.MultiBufferSource;
import net.minecraft.client.renderer.RenderType;
import net.minecraft.client.renderer.texture.OverlayTexture;
import net.minecraft.resources.ResourceLocation;

/** Small real 3D hair-cap and necklace parts attached to the animated player model. */
public final class CJAccessories {
    public static final ModelLayerLocation LAYER_LOCATION = new ModelLayerLocation(
            new ResourceLocation(CJCharacterSwitch.MOD_ID, "cj_accessories"), "main");

    private static final ResourceLocation TEXTURE = new ResourceLocation(
            CJCharacterSwitch.MOD_ID, "textures/entity/cj_accessories.png");

    private final ModelPart hair;
    private final ModelPart necklace;

    public CJAccessories(ModelPart root) {
        this.hair = root.getChild("hair");
        this.necklace = root.getChild("necklace");
    }

    public static LayerDefinition createLayer() {
        MeshDefinition mesh = new MeshDefinition();
        PartDefinition root = mesh.getRoot();

        root.addOrReplaceChild("hair",
                CubeListBuilder.create()
                        .texOffs(0, 0)
                        .addBox(-4.08F, -8.28F, -4.08F, 8.16F, 1.75F, 8.16F),
                PartPose.ZERO);

        root.addOrReplaceChild("necklace",
                CubeListBuilder.create()
                        .texOffs(32, 0)
                        .addBox(-2.5F, 1.15F, -2.22F, 5.0F, 0.45F, 0.18F),
                PartPose.ZERO);

        return LayerDefinition.create(mesh, 64, 64);
    }

    public void render(PoseStack poseStack, MultiBufferSource buffers,
                       PlayerModel<?> playerModel, int packedLight) {
        hair.copyFrom(playerModel.head);
        necklace.copyFrom(playerModel.body);

        VertexConsumer consumer = buffers.getBuffer(RenderType.entityCutoutNoCull(TEXTURE));
        hair.render(poseStack, consumer, packedLight, OverlayTexture.NO_OVERLAY);
        necklace.render(poseStack, consumer, packedLight, OverlayTexture.NO_OVERLAY);
    }
}
