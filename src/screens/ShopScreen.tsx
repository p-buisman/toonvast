import { useState } from "react";
import { Avatar } from "../components/common/Avatar.tsx";
import { Button } from "../components/common/Button.tsx";
import { Card } from "../components/common/Card.tsx";
import { Chip } from "../components/common/Chip.tsx";
import { Icon, type IconName } from "../components/common/Icon.tsx";
import { Screen } from "../components/layout/Screen.tsx";
import { Tabs } from "../components/common/Tabs.tsx";
import { MAX_SHIELDS } from "../engine/game/rules.ts";
import {
  applyItem,
  buyRefusal,
  DEFAULT_THEME,
  itemActive,
  itemReady,
  itemShown,
  SHIELD_ITEM_ID,
  SHOP_ITEMS,
  THEMES,
  type ShopCategory,
  type ShopItem,
} from "../engine/game/shop.ts";
import { buyItem, updateProfile } from "../storage/repo.ts";
import { useApp } from "../state/useApp.ts";
import { useProfilePurchases } from "../state/queries.ts";
import { MainTabs } from "./MainTabs.tsx";

const THEME_ICON: Record<string, IconName> = { "theme-zee": "wave", "theme-bos": "tree", "theme-zon": "sun", "theme-nacht": "moon" };
const REFUSAL = { owned: "Al gekocht", coins: "Niet genoeg munten", shields: "Je hebt er al twee" };
const CATEGORY_HINT: Record<ShopCategory, string> = {
  avatar: "Hoeden, brillen, koptelefoon, strik en achtergronden. Tik op iets dat je hebt om het aan of uit te zetten. Grijs is nog in de maak.",
  look: "Extra blikken en monden. Gekocht is voor altijd van jou; kiezen doe je hier of bij je profiel.",
  theme: "Een thema kleurt de hele app. Tik op een thema dat je hebt om het aan te zetten.",
  extra: "",
};

export function ShopScreen() {
  const { profile, wallet } = useApp();
  const [category, setCategory] = useState<ShopCategory>("avatar");
  const [message, setMessage] = useState<string | null>(null);
  /** The item shown in the confirmation sheet before it is paid for. */
  const [preview, setPreview] = useState<ShopItem | null>(null);
  const owned = useProfilePurchases(profile?.id);
  if (!profile) return null;

  const isActive = (item: ShopItem) => (item.category === "theme" ? profile.theme === item.id : itemActive(profile.avatar, item));

  const tap = async (item: ShopItem) => {
    if (!itemReady(item)) return;
    if (item.id !== SHIELD_ITEM_ID && owned.has(item.id)) {
      // Owned: put it on or take it off.
      if (item.category === "theme") await updateProfile(profile.id, { theme: isActive(item) ? DEFAULT_THEME : item.id });
      else if (item.slot) await updateProfile(profile.id, { avatar: applyItem(profile.avatar, item, !isActive(item)) });
      return;
    }
    const refusal = buyRefusal(item, wallet.coins, owned, wallet.shields, MAX_SHIELDS);
    if (refusal) {
      setMessage(REFUSAL[refusal]);
      return;
    }
    setMessage(null);
    setPreview(item);
  };

  /** Pay and put the item on; only after the player confirmed the preview. */
  const confirm = async () => {
    const item = preview;
    if (!item) return;
    setPreview(null);
    if (buyRefusal(item, wallet.coins, owned, wallet.shields, MAX_SHIELDS)) return;
    await buyItem(profile.id, item);
    setMessage(`${item.title} gekocht!`);
    if (item.category === "theme") await updateProfile(profile.id, { theme: item.id });
    else if (item.slot) await updateProfile(profile.id, { avatar: applyItem(profile.avatar, item) });
  };

  const previewAvatar = preview?.slot ? applyItem(profile.avatar, preview) : profile.avatar;
  // What every profile gets for free is not for sale.
  const items = SHOP_ITEMS.filter((i) => i.category === category && itemShown(i));
  const themeTitle = THEMES.find((t) => t.id === profile.theme)?.title ?? "Standaard";

  /** What a card shows: the avatar wearing the item, or the icon of a theme. */
  const picture = (item: ShopItem) => {
    if (item.slot) return <Avatar avatar={applyItem(profile.avatar, item)} name={profile.name} size={56} />;
    if (item.category === "theme") return <Icon name={THEME_ICON[item.id] ?? "gift"} />;
    return <Icon name="gift" />;
  };

  return (
    <Screen footer={<MainTabs active="shop" />}>
      <div className="row spread">
        <h1>Winkel</h1>
        <Chip tone="gold" big>
          <Icon name="coin" /> {wallet.coins} munten
        </Chip>
      </div>
      <Card className="row">
        <Avatar avatar={profile.avatar} name={profile.name} size={88} />
        <div className="grow">
          <b>Jouw avatar</b>
          <div className="muted">Thema {themeTitle}</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Munten verdien je met goede antwoorden, je dagdoel, levels en badges. Je XP gaat er niet van af.
          </div>
        </div>
      </Card>
      <Tabs<ShopCategory>
        options={[
          { value: "avatar", label: "Avatar" },
          { value: "look", label: "Uiterlijk" },
          { value: "theme", label: "Thema's" },
          { value: "extra", label: "Extra" },
        ]}
        value={category}
        onChange={setCategory}
      />
      {message && <p className="muted center">{message}</p>}
      {category === "extra" ? (
        <Card className="row">
          <div className="pic" style={{ fontSize: 32 }}>
            <Icon name="shield" />
          </div>
          <div className="grow">
            <b>Streakbeschermer</b>
            <div className="muted">
              Vangt één gemiste dag op · je hebt er {wallet.shields} (max. {MAX_SHIELDS})
            </div>
          </div>
          <button type="button" className="chip gold big" onClick={() => void tap(SHOP_ITEMS.find((i) => i.id === SHIELD_ITEM_ID)!)}>
            <Icon name="coin" /> 40
          </button>
        </Card>
      ) : (
        <div className="shop-grid">
          {items.map((item) => {
            const has = owned.has(item.id);
            const ready = itemReady(item);
            const active = ready && has && isActive(item);
            return (
              <button
                key={item.id}
                type="button"
                className={["shop-item", has ? "owned" : "", active ? "active" : "", ready ? "" : "soon"].join(" ")}
                disabled={!ready}
                onClick={() => void tap(item)}
              >
                <div className="pic">{picture(item)}</div>
                <b>{item.title}</b>
                {!ready ? (
                  <Chip tone="grey">Komt nog</Chip>
                ) : active ? (
                  <Chip>Aan</Chip>
                ) : has ? (
                  <Chip tone="ok">Gekocht</Chip>
                ) : (
                  <Chip tone="gold">
                    <Icon name="coin" /> {item.price}
                  </Chip>
                )}
              </button>
            );
          })}
        </div>
      )}
      {CATEGORY_HINT[category] && <p className="muted center">{CATEGORY_HINT[category]}</p>}
      {preview && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`${preview.title} kopen`} onClick={() => setPreview(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row spread">
              <b style={{ fontSize: 18 }}>{preview.title}</b>
              <Chip tone="gold" big>
                <Icon name="coin" /> {preview.price}
              </Chip>
            </div>
            {preview.slot && (
              <div className="row" style={{ justifyContent: "center", gap: 24 }}>
                <div className="center">
                  <Avatar avatar={profile.avatar} name={profile.name} size={72} />
                  <div className="muted">nu</div>
                </div>
                <span style={{ fontSize: 24, color: "var(--muted)" }}>
                  <Icon name="arrow-right" />
                </span>
                <div className="center">
                  <Avatar avatar={previewAvatar} name={profile.name} size={110} />
                  <div className="muted">met {preview.title.toLowerCase()}</div>
                </div>
              </div>
            )}
            {preview.category === "theme" && (
              <div className="theme-preview" data-theme={preview.id}>
                <div className="row spread">
                  <b>Thema {preview.title}</b>
                  <span className="chip">
                    <Icon name="star" /> {wallet.xp} XP
                  </span>
                </div>
                <div className="mini-card">
                  <Avatar avatar={profile.avatar} name={profile.name} size={32} />
                  <div className="grow">
                    <b>{profile.name}</b>
                    <div className="muted">Zo zien de kaarten eruit</div>
                  </div>
                </div>
                <div className="mini-btn">Zo zien de knoppen eruit</div>
              </div>
            )}
            {preview.id === SHIELD_ITEM_ID && (
              <div className="row">
                <div style={{ fontSize: 40 }}>
                  <Icon name="shield" />
                </div>
                <div className="muted grow">Vangt één gemiste dag op, zodat je reeks doorloopt. Je hebt er na aankoop {wallet.shields + 1}.</div>
              </div>
            )}
            <p className="muted">
              Je hebt {wallet.coins} munten; na deze aankoop {wallet.coins - preview.price}.
            </p>
            <Button block onClick={() => void confirm()}>
              Kopen voor <Icon name="coin" /> {preview.price}
            </Button>
            <Button block variant="ghost" onClick={() => setPreview(null)}>
              Annuleren
            </Button>
          </div>
        </div>
      )}
    </Screen>
  );
}
