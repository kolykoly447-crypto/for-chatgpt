package com.example.cjswitch.client;

import com.example.cjswitch.CJCharacterSwitch;
import com.mojang.blaze3d.vertex.PoseStack;
import com.mojang.blaze3d.vertex.VertexConsumer;
import net.minecraft.client.model.PlayerModel;
import net.minecraft.client.player.AbstractClientPlayer;
import net.minecraft.client.renderer.MultiBufferSource;
import net.minecraft.client.renderer.RenderType;
import net.minecraft.client.renderer.entity.layers.RenderLayer;
import net.minecraft.client.renderer.texture.OverlayTexture;
import net.minecraft.resources.ResourceLocation;

/** Draws the CJ skin while the normal player model is hidden. */
public final class CJPlayerLayer extends RenderLayer<AbstractClientPlayer, PlayerModel<AbstractClientPlayer>> {
    private static final ResourceLocation CJ_TEXTURE = new ResourceLocation(
            CJCharacterSwitch.MOD_ID, "textures/entity/cj.png");

    private final CJAccessories accessories;

    public CJPlayerLayer(net.minecraft.client.renderer.entity.RenderLayerParent<AbstractClientPlayer, PlayerModel<AbstractClientPlayer>> parent,
                         CJAccessories accessories) {
        super(parent);
        this.accessories = accessories;
    }

    @Override
    public void render(PoseStack poseStack, MultiBufferSource buffers, int packedLight,
                       AbstractClientPlayer player, float limbSwing, float limbSwingAmount,
                       float partialTick, float ageInTicks, float netHeadYaw, float headPitch) {
        if (player != net.minecraft.client.Minecraft.getInstance().player
                || !ClientHooks.isCjEnabled()) {
            return;
        }

        PlayerModel<AbstractClientPlayer> model = getParentModel();
        model.setAllVisible(true);
        try {
            VertexConsumer consumer = buffers.getBuffer(RenderType.entityCutoutNoCull(CJ_TEXTURE));
            model.renderToBuffer(poseStack, consumer, packedLight, OverlayTexture.NO_OVERLAY,
                    1.0F, 1.0F, 1.0F, 1.0F);
            accessories.render(poseStack, buffers, model, packedLight);
        } finally {
            model.setAllVisible(false);
        }
    }
}
