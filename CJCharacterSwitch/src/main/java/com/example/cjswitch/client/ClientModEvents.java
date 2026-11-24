package com.example.cjswitch.client;

import com.example.cjswitch.CJCharacterSwitch;
import net.minecraft.client.model.geom.ModelPart;
import net.minecraft.client.renderer.entity.player.PlayerRenderer;
import net.minecraftforge.client.event.EntityRenderersEvent;
import net.minecraftforge.client.event.RegisterKeyMappingsEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.api.distmarker.Dist;

/** Events on Forge's mod bus; this class is loaded on the physical client only. */
@Mod.EventBusSubscriber(modid = CJCharacterSwitch.MOD_ID,
        bus = Mod.EventBusSubscriber.Bus.MOD, value = Dist.CLIENT)
public final class ClientModEvents {
    private ClientModEvents() {
    }

    @SubscribeEvent
    public static void registerKeys(RegisterKeyMappingsEvent event) {
        event.register(ClientHooks.TOGGLE_CHARACTER);
    }

    @SubscribeEvent
    public static void registerLayers(EntityRenderersEvent.RegisterLayerDefinitions event) {
        event.registerLayerDefinition(CJAccessories.LAYER_LOCATION, CJAccessories::createLayer);
    }

    @SubscribeEvent
    public static void addPlayerLayers(EntityRenderersEvent.AddLayers event) {
        for (String skinName : event.getSkins()) {
            PlayerRenderer renderer = event.getSkin(skinName);
            if (renderer != null) {
                ModelPart accessoryRoot = event.getEntityModels().bakeLayer(CJAccessories.LAYER_LOCATION);
                renderer.addLayer(new CJPlayerLayer(renderer, new CJAccessories(accessoryRoot)));
            }
        }
    }
}
