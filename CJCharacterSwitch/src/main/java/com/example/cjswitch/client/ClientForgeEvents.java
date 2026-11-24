package com.example.cjswitch.client;

import com.example.cjswitch.CJCharacterSwitch;
import net.minecraft.client.Minecraft;
import net.minecraft.network.chat.Component;
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.client.event.RenderPlayerEvent;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

/** Client events on the main Forge event bus. */
@Mod.EventBusSubscriber(modid = CJCharacterSwitch.MOD_ID,
        bus = Mod.EventBusSubscriber.Bus.FORGE, value = Dist.CLIENT)
public final class ClientForgeEvents {
    private ClientForgeEvents() {
    }

    @SubscribeEvent
    public static void onClientTick(TickEvent.ClientTickEvent event) {
        if (event.phase != TickEvent.Phase.END) {
            return;
        }

        Minecraft minecraft = Minecraft.getInstance();
        while (ClientHooks.TOGGLE_CHARACTER.consumeClick()) {
            ClientHooks.toggle();
            if (minecraft.player != null) {
                minecraft.player.displayClientMessage(
                        Component.translatable(ClientHooks.isCjEnabled()
                                ? "message.cjswitch.enabled"
                                : "message.cjswitch.disabled"),
                        true);
            }
        }
    }

    @SubscribeEvent
    public static void onRenderPlayerPre(RenderPlayerEvent.Pre event) {
        Minecraft minecraft = Minecraft.getInstance();
        if (ClientHooks.isCjEnabled() && minecraft.player != null
                && event.getEntity() == minecraft.player) {
            event.getRenderer().getModel().setAllVisible(false);
        }
    }

    @SubscribeEvent
    public static void onRenderPlayerPost(RenderPlayerEvent.Post event) {
        Minecraft minecraft = Minecraft.getInstance();
        if (minecraft.player != null && event.getEntity() == minecraft.player) {
            event.getRenderer().getModel().setAllVisible(true);
        }
    }
}
