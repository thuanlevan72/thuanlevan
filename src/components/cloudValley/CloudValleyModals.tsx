import { useState, type ChangeEvent } from 'react';
import {
  Award,
  BookOpen,
  Check,
  Download,
  Factory,
  Hammer,
  Package,
  ShoppingBag,
  Sparkles,
  Sunrise,
  Upload,
  X,
} from 'lucide-react';
import {
  ARTISAN_RECIPES,
  AUTOMATION_BLUEPRINTS,
  CROPS,
  FARMER_HATS,
  FARMER_SHIRTS,
  HYBRID_RECIPES,
  ITEMS,
  MACHINES,
  TERRACES,
  TOOL_UPGRADE_COSTS,
  type FarmerHatId,
  type SpriteTask,
} from '../../utils/cloudValleyData.ts';
import {
  getSellPrice,
  type CloudValleyGameState,
  type OfflineCatchupReport,
} from '../../utils/cloudValleyEngine.ts';

export type CloudValleyModalId =
  | null
  | 'orders'
  | 'workshop'
  | 'almanac'
  | 'automation'
  | 'offline'
  | 'settings';

interface CloudValleyModalsProps {
  modal: CloudValleyModalId;
  state: CloudValleyGameState;
  offlineReport: OfflineCatchupReport | null;
  onClose: () => void;
  onFulfillOrder: (orderId: string) => void;
  onTradeFair: (qty: number) => void;
  onSellItem: (itemId: string, qty: number) => void;
  onBuyItem: (itemId: string, qty: number) => void;
  onBuySeedPack: (seedId: string, qty: number) => void;
  onStartRecipe: (recipeId: string) => void;
  onCollectArtisan: (uid: string) => void;
  onCollectAllArtisan: () => void;
  onUnlockTerrace: (terraceId: number) => void;
  onUpgradeTools: () => void;
  onBuyLivestock: (type: 'cow' | 'sheep' | 'chicken') => void;
  onTendLivestock: (animalId: string) => void;
  onSummonSprite: (task: SpriteTask) => void;
  onChangeSpriteTask: (spriteId: string, task: SpriteTask) => void;
  onFeedSprite: (spriteId: string, mealId: string) => void;
  onSelectBuildStructure: (structId: keyof typeof AUTOMATION_BLUEPRINTS) => void;
  onUpdateProfile: (patch: { name?: string; hat?: FarmerHatId; shirtColor?: string }) => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onResetSave: () => void;
}

export function CloudValleyModals({
  modal,
  state,
  offlineReport,
  onClose,
  onFulfillOrder,
  onTradeFair,
  onSellItem,
  onBuyItem,
  onBuySeedPack,
  onStartRecipe,
  onCollectArtisan,
  onCollectAllArtisan,
  onUnlockTerrace,
  onUpgradeTools,
  onBuyLivestock,
  onTendLivestock,
  onSummonSprite,
  onChangeSpriteTask,
  onFeedSprite,
  onSelectBuildStructure,
  onUpdateProfile,
  onExportJson,
  onImportJson,
  onResetSave,
}: CloudValleyModalsProps) {
  const [workshopTierFilter, setWorkshopTierFilter] = useState<'all' | 1 | 2 | 3>('all');
  const [ordersTab, setOrdersTab] = useState<'orders' | 'seeds' | 'market'>('orders');
  const [confirmReset, setConfirmReset] = useState(false);

  if (!modal) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImportJson(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#1B130B]/60 pointer-events-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        data-testid={`cv-modal-${modal}`}
        className="w-full max-w-3xl max-h-[88dvh] flex flex-col rounded-2xl border-2 border-[#7C5230] bg-[#FDF7EC] text-[#2D1E12] shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#EFE2CB] border-b border-[#D6BE96]">
          <div className="flex items-center gap-2.5">
            {modal === 'orders' && <ShoppingBag className="w-5 h-5 text-[#B45309]" />}
            {modal === 'workshop' && <Factory className="w-5 h-5 text-[#9A3412]" />}
            {modal === 'almanac' && <BookOpen className="w-5 h-5 text-[#2E7D32]" />}
            {modal === 'automation' && <Hammer className="w-5 h-5 text-[#0369A1]" />}
            {modal === 'offline' && <Sunrise className="w-5 h-5 text-[#D97706]" />}
            {modal === 'settings' && <Package className="w-5 h-5 text-[#5C3A21]" />}
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#2D1E12]">
              {modal === 'orders' && 'Bảng Đơn Hàng & Chợ Phiên'}
              {modal === 'workshop' && 'Xưởng Chế Biến Thủ Công 3 Tầng'}
              {modal === 'almanac' && `Sổ Tay Thực Vật (${state.almanacUnlocked.length}/${Object.keys(CROPS).length})`}
              {modal === 'automation' && 'Chuồng Trại, Mở Rộng & Tự Động Hóa'}
              {modal === 'offline' && 'Báo Cáo Thu Hoạch Khi Bạn Vắng Mặt'}
              {modal === 'settings' && 'Hồ Sơ Nông Trại & Hướng Dẫn'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="w-8 h-8 rounded-lg border border-[#C7AC82] bg-[#FAF0DC] hover:bg-[#EBD8B7] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 1. ORDERS & MARKET */}
          {modal === 'orders' && (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-[#DFCAA5] pb-2">
                <button
                  type="button"
                  onClick={() => setOrdersTab('orders')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    ordersTab === 'orders'
                      ? 'bg-[#6E4726] text-white'
                      : 'bg-[#F3E6CE] text-[#5C3A21] hover:bg-[#E7D4B2]'
                  }`}
                >
                  Đơn Hàng Làng ({state.orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrdersTab('seeds')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    ordersTab === 'seeds'
                      ? 'bg-[#2E7D32] text-white'
                      : 'bg-[#F3E6CE] text-[#5C3A21] hover:bg-[#E7D4B2]'
                  }`}
                >
                  Cửa Hàng Hạt Giống
                </button>
                <button
                  type="button"
                  onClick={() => setOrdersTab('market')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    ordersTab === 'market'
                      ? 'bg-[#6E4726] text-white'
                      : 'bg-[#F3E6CE] text-[#5C3A21] hover:bg-[#E7D4B2]'
                  }`}
                >
                  Kho & Bán Nông Sản
                </button>
              </div>

              {ordersTab === 'seeds' ? (
                <div className="space-y-3">
                  <p className="text-xs text-[#5C3A21]">
                    Mua hạt giống bỏ vào <strong>Túi Hạt</strong> để gieo miễn phí ngoài ruộng (hoặc gieo trực tiếp trừ Vàng khi hết túi).
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.values(CROPS)
                      .filter((c) => c.seedPrice > 0)
                      .map((crop) => {
                        const locked = state.level < crop.unlockLevel;
                        const inBag = state.seedBags?.[crop.id] ?? 0;
                        return (
                          <div
                            key={crop.id}
                            className="p-2.5 rounded-xl border border-[#D6BE96] bg-[#FFFDF8] flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#2D1E12] flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                  style={{ backgroundColor: crop.colorPrimary }}
                                />
                                <span className="truncate">{crop.name}</span>
                              </p>
                              <p className="text-[11px] text-[#7C5230] tabular-nums">
                                {locked ? `Mở ở Cấp ${crop.unlockLevel}` : `${crop.seedPrice}g/hạt · Túi: ${inBag}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={locked || state.gold < crop.seedPrice}
                                onClick={() => onBuySeedPack(crop.id, 1)}
                                className="px-2 py-1 rounded bg-[#2E7D32] hover:bg-[#1B5E20] disabled:opacity-40 text-white text-[11px] font-bold cursor-pointer"
                              >
                                +1
                              </button>
                              <button
                                type="button"
                                disabled={locked || state.gold < crop.seedPrice * 5}
                                onClick={() => onBuySeedPack(crop.id, 5)}
                                className="px-2 py-1 rounded bg-[#166534] hover:bg-[#14532D] disabled:opacity-40 text-white text-[11px] font-bold cursor-pointer"
                              >
                                +5
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : ordersTab === 'orders' ? (
                <div className="space-y-3">
                  {/* Weekend Fair Banner */}
                  {state.weekendFair ? (
                    <div className="p-3.5 rounded-xl border-2 border-[#D97706] bg-[#FEF3C7] flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#92400E]">
                          Chợ Phiên Cuối Tuần · Ngày 7 · Giá ×2.5
                        </p>
                        <p className="text-sm font-bold text-[#451A03] mt-0.5">
                          Thương nhân thu mua: {ITEMS[state.weekendFair.itemId]?.name} (
                          {Math.round(getSellPrice(state, state.weekendFair.itemId) * 2.5)} Vàng/cái)
                        </p>
                        <p className="text-xs text-[#78350F]">
                          Trong kho: {state.inventory[state.weekendFair.itemId] ?? 0} · Đã bán:{' '}
                          {state.weekendFair.tradesDone}/{state.weekendFair.maxTrades}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={(state.inventory[state.weekendFair.itemId] ?? 0) < 1}
                        onClick={() => onTradeFair(1)}
                        className="px-3.5 py-2 rounded-lg bg-[#D97706] hover:bg-[#B45309] disabled:opacity-45 text-white text-xs font-bold cursor-pointer"
                      >
                        Bán 1 Cái (×2.5)
                      </button>
                    </div>
                  ) : (
                    <div className="px-3 py-2 rounded-lg bg-[#F3E7D0] text-xs text-[#6E4726]">
                      Chợ Phiên Cuối Tuần sẽ mở vào <strong>Ngày 7</strong> mỗi mùa để thu mua đặc sản giá <strong>×2.5</strong>.
                    </div>
                  )}

                  {/* Active Villager Orders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {state.orders.map((ord) => {
                      const have = state.inventory[ord.itemId] ?? 0;
                      const ready = have >= ord.qty;
                      return (
                        <div
                          key={ord.id}
                          className="p-3 rounded-xl border border-[#D6BE96] bg-[#FFFDF8] flex flex-col justify-between gap-2.5"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-semibold text-[#7C5230]">
                              <span>{ord.villagerName}</span>
                              <span>Còn {ord.daysLeft} ngày</span>
                            </div>
                            <p className="text-sm font-bold text-[#2D1E12] mt-1">{ord.title}</p>
                            <p className="text-xs text-[#5C3A21] mt-0.5 tabular-nums">
                              Đang có: <strong className={ready ? 'text-[#15803D]' : 'text-[#B45309]'}>{have}/{ord.qty}</strong>
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-[#EFE3CE]">
                            <div className="flex items-center gap-2 text-xs font-bold tabular-nums">
                              <span className="text-[#B45309]">+{ord.rewardGold} Vàng</span>
                              <span className="text-[#0369A1]">+{ord.rewardBadges} Huy Hiệu</span>
                            </div>
                            <button
                              type="button"
                              disabled={!ready}
                              onClick={() => onFulfillOrder(ord.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#2E7D32] hover:bg-[#1B5E20] disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                            >
                              Giao Đơn
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Buy basic supplies */}
                  <div className="p-3 rounded-xl border border-[#D6BE96] bg-[#F7EBD5] space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#6E4726]">Mua Vật Tư Nhanh</p>
                    <div className="flex flex-wrap gap-2">
                      {(['co_kho', 'phan_huu_co', 'phan_dot_bien'] as const).map((id) => {
                        const it = ITEMS[id];
                        const buyPrice = Math.round(it.sellPrice * 1.4);
                        return (
                          <button
                            key={id}
                            type="button"
                            disabled={state.gold < buyPrice}
                            onClick={() => onBuyItem(id, 1)}
                            className="px-3 py-1.5 rounded-lg border border-[#C7AC82] bg-[#FFFDF8] hover:bg-[#FDE68A]/50 disabled:opacity-40 text-xs font-semibold cursor-pointer"
                          >
                            +1 {it.name} ({buyPrice} Vàng)
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inventory Sell List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.entries(state.inventory)
                      .filter(([, qty]) => qty > 0)
                      .map(([itemId, qty]) => {
                        const def = ITEMS[itemId];
                        if (!def) return null;
                        const sellUnit = getSellPrice(state, itemId);
                        return (
                          <div
                            key={itemId}
                            className="p-2.5 rounded-xl border border-[#D6BE96] bg-[#FFFDF8] flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#2D1E12] truncate">
                                {def.name} <span className="text-[#0369A1] tabular-nums">×{qty}</span>
                              </p>
                              <p className="text-[11px] text-[#7C5230] tabular-nums">
                                Giá bán: {sellUnit} Vàng/cái
                                {def.canAgeInCellar && state.wineAgedDays > 0 ? ` (Ủ +${state.wineAgedDays} ngày)` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => onSellItem(itemId, 1)}
                                className="px-2 py-1 rounded bg-[#D97706] hover:bg-[#B45309] text-white text-[11px] font-bold cursor-pointer"
                              >
                                Bán 1
                              </button>
                              {qty > 1 && (
                                <button
                                  type="button"
                                  onClick={() => onSellItem(itemId, qty)}
                                  className="px-2 py-1 rounded bg-[#7C5230] hover:bg-[#5C3A21] text-white text-[11px] font-bold cursor-pointer"
                                >
                                  Hết
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 2. 3-TIER ARTISAN WORKSHOP */}
          {modal === 'workshop' && (
            <div className="space-y-4">
              {/* Active Queue */}
              <div className="p-3 rounded-xl border border-[#D6BE96] bg-[#F5E8D0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6E4726]">
                    Hàng Đợi Chế Biến ({state.artisanQueue.length}/8)
                  </span>
                  {state.artisanQueue.some((s) => s.ready) && (
                    <button
                      type="button"
                      onClick={onCollectAllArtisan}
                      className="px-2.5 py-1 rounded-lg bg-[#2E7D32] text-white text-xs font-bold cursor-pointer"
                    >
                      Thu Tất Cả Sẵn Sàng
                    </button>
                  )}
                </div>
                {state.artisanQueue.length === 0 ? (
                  <p className="text-xs text-[#7C5230]">Chưa có mẻ chế biến nào đang chạy. Chọn công thức bên dưới!</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {state.artisanQueue.map((slot) => {
                      const pct = slot.ready
                        ? 100
                        : Math.round(((slot.totalSeconds - slot.remainingSeconds) / slot.totalSeconds) * 100);
                      return (
                        <div
                          key={slot.uid}
                          className="p-2.5 rounded-lg border border-[#C7AC82] bg-[#FFFDF8] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#2D1E12] truncate">
                              {ITEMS[slot.outputItemId]?.name} ×{slot.outputQty}
                            </p>
                            <p className="text-[11px] text-[#7C5230]">
                              {MACHINES[slot.machineId].name} · {slot.ready ? 'Hoàn tất!' : `${Math.ceil(slot.remainingSeconds)}s (${pct}%)`}
                            </p>
                          </div>
                          {slot.ready && (
                            <button
                              type="button"
                              onClick={() => onCollectArtisan(slot.uid)}
                              className="px-2.5 py-1 rounded bg-[#2E7D32] text-white text-xs font-bold cursor-pointer"
                            >
                              Nhận
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tier Filter */}
              <div className="flex flex-wrap gap-1.5">
                {(['all', 1, 2, 3] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setWorkshopTierFilter(tier)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      workshopTierFilter === tier
                        ? 'bg-[#9A3412] text-white'
                        : 'bg-[#F3E6CE] text-[#5C3A21] hover:bg-[#E7D4B2]'
                    }`}
                  >
                    {tier === 'all' ? 'Tất Cả Chuỗi' : `Tầng ${tier}`}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ARTISAN_RECIPES.filter((r) => workshopTierFilter === 'all' || r.tier === workshopTierFilter).map((rec) => {
                  const unlocked = state.level >= rec.unlockLevel;
                  const canCraft =
                    unlocked && rec.inputs.every((inp) => (state.inventory[inp.itemId] ?? 0) >= inp.qty);
                  return (
                    <div
                      key={rec.id}
                      className="p-3 rounded-xl border border-[#D6BE96] bg-[#FFFDF8] flex flex-col justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#9A3412]">
                          <span>Tầng {rec.tier} · {MACHINES[rec.machineId].name}</span>
                          <span>{rec.durationSeconds}s</span>
                        </div>
                        <p className="text-sm font-bold text-[#2D1E12] mt-0.5">{rec.name}</p>
                        <div className="flex flex-wrap gap-2 mt-1.5 text-[11px]">
                          {rec.inputs.map((inp) => {
                            const have = state.inventory[inp.itemId] ?? 0;
                            return (
                              <span
                                key={inp.itemId}
                                className={have >= inp.qty ? 'text-[#15803D] font-semibold' : 'text-[#B91C1C] font-semibold'}
                              >
                                {ITEMS[inp.itemId]?.name}: {have}/{inp.qty}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!canCraft}
                        onClick={() => onStartRecipe(rec.id)}
                        className="w-full py-1.5 rounded-lg bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                      >
                        {!unlocked
                          ? `Mở ở Cấp ${rec.unlockLevel}`
                          : `Chế Biến → ${ITEMS[rec.outputItemId]?.name} ×${rec.outputQty}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. BOTANICAL ALMANAC */}
          {modal === 'almanac' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl border border-[#C084FC] bg-[#F5F0FF] space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#6B21A8] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Bí Kíp Lai Tạo & Đột Biến Gen (Tỷ lệ 10% · Phân Đột Biến 35%)
                </p>
                <p className="text-xs text-[#4C1D95]">
                  Trồng 2 giống cây trưởng thành khác nhau nằm cạnh một ô đất đã cày trống. Mỗi chu kỳ tick sẽ có cơ hội sinh Mầm Lai!
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {HYBRID_RECIPES.map((hr) => {
                    const discovered = state.almanacUnlocked.includes(hr.resultCropId);
                    return (
                      <div
                        key={hr.id}
                        className={`p-2.5 rounded-lg border ${
                          discovered
                            ? 'border-[#9333EA] bg-white text-[#2D1E12]'
                            : 'border-[#DDD6FE] bg-[#FAF5FF] text-[#6B7280]'
                        }`}
                      >
                        <p className="text-xs font-bold">
                          {CROPS[hr.parentA]?.name} + {CROPS[hr.parentB]?.name} →{' '}
                          <span className="text-[#7E22CE]">{discovered ? hr.name : '??? (Chưa khám phá)'}</span>
                        </p>
                        <p className="text-[11px] mt-0.5">{hr.traitSummary}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.values(CROPS).map((crop) => {
                  const unlocked = state.almanacUnlocked.includes(crop.id);
                  return (
                    <div
                      key={crop.id}
                      className={`p-3 rounded-xl border ${
                        unlocked ? 'border-[#D6BE96] bg-[#FFFDF8]' : 'border-[#E5DCCB] bg-[#F6EFE2] opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full inline-block border border-black/20"
                            style={{ backgroundColor: crop.colorPrimary }}
                          />
                          {unlocked ? crop.name : 'Giống Chưa Mở Khóa'}
                        </span>
                        <span className="text-[11px] font-bold text-[#B45309] tabular-nums">
                          {crop.sellPrice} Vàng
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C3A21] mt-1">{crop.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. AUTOMATION, LIVESTOCK, TOOLS & TERRACES */}
          {modal === 'automation' && (
            <div className="space-y-4">
              {/* Terrace Expansion */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E4726]">
                  Mở Rộng Ruộng Bậc Thang
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TERRACES.map((t) => {
                    const owned = state.unlockedTerraces.includes(t.id);
                    const canBuy = !owned && state.level >= t.minLevel && state.gold >= t.costGold;
                    return (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl border border-[#D6BE96] bg-[#FFFDF8] flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#2D1E12]">{t.name}</p>
                          <p className="text-[11px] text-[#7C5230]">{t.subtitle}</p>
                        </div>
                        {owned ? (
                          <span className="text-xs font-bold text-[#15803D] flex items-center gap-1 shrink-0">
                            <Check className="w-3.5 h-3.5" /> Đã Mở
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={!canBuy}
                            onClick={() => onUnlockTerrace(t.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#2E7D32] hover:bg-[#1B5E20] disabled:opacity-40 text-white text-xs font-bold shrink-0 cursor-pointer"
                          >
                            {state.level < t.minLevel ? `Cấp ${t.minLevel}` : `${t.costGold} Vàng`}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tool Upgrades & Blueprints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-[#D6BE96] bg-[#FFFDF8] space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#6E4726]">Nâng Cấp Công Cụ (Cọ 3×3)</p>
                  {state.toolTier === 'iron' ? (
                    <p className="text-xs font-bold text-[#15803D]">Đã đạt Bộ Công Cụ Sắt 3×3 tối đa!</p>
                  ) : (
                    (() => {
                      const nextKey = state.toolTier === 'wood' ? 'copper' : 'iron';
                      const next = TOOL_UPGRADE_COSTS[nextKey];
                      return (
                        <div className="space-y-2">
                          <p className="text-xs font-bold">{next.label}</p>
                          <p className="text-[11px] text-[#5C3A21]">{next.areaText}</p>
                          <button
                            type="button"
                            disabled={state.level < next.minLevel || state.gold < next.gold}
                            onClick={onUpgradeTools}
                            className="px-3 py-1.5 rounded-lg bg-[#B45309] disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                          >
                            {state.level < next.minLevel ? `Cần Cấp ${next.minLevel}` : `Rèn (${next.gold} Vàng)`}
                          </button>
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* Earth Sprites */}
                <div className="p-3 rounded-xl border border-[#D6BE96] bg-[#FFFDF8] space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#15803D]">
                      Tinh Linh Đất ({state.sprites.length}/4)
                    </p>
                    <button
                      type="button"
                      onClick={() => onSummonSprite('harvest')}
                      className="px-2.5 py-1 rounded bg-[#15803D] text-white text-[11px] font-bold cursor-pointer"
                    >
                      + Triệu Hồi ({240 + state.sprites.length * 140}g · 2 Huy Hiệu)
                    </button>
                  </div>
                  {state.sprites.length === 0 ? (
                    <p className="text-[11px] text-[#5C3A21]">
                      Triệu hồi Tinh Linh Đất để tự động Gieo hạt, Thu hoạch & Nạp Xưởng ngay cả khi tắt game!
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {state.sprites.map((sp) => (
                        <div key={sp.id} className="p-2 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span>{sp.name}</span>
                            <span className="tabular-nums text-[#15803D]">NL: {Math.round(sp.energy)}%</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(['harvest', 'sow', 'feed_machines'] as const).map((tk) => (
                              <button
                                key={tk}
                                type="button"
                                onClick={() => onChangeSpriteTask(sp.id, tk)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                  sp.task === tk ? 'bg-[#15803D] text-white' : 'bg-white border border-[#86EFAC]'
                                }`}
                              >
                                {tk === 'harvest' ? 'Thu Hoạch' : tk === 'sow' ? 'Gieo Hạt' : 'Chạy Xưởng'}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => onFeedSprite(sp.id, 'banh_mi_bo_toi')}
                              className="px-2 py-0.5 rounded bg-[#D97706] text-white text-[10px] font-bold cursor-pointer"
                            >
                              Cho Ăn Bánh
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Automation Blueprints */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">
                  Thiết Bị Tự Động Hóa (Đặt trực tiếp lên ô đất)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.values(AUTOMATION_BLUEPRINTS).map((bp) => (
                    <div
                      key={bp.id}
                      className="p-2.5 rounded-xl border border-[#D6BE96] bg-[#FFFDF8] flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-xs font-bold">{bp.name}</p>
                        <p className="text-[11px] text-[#5C3A21]">{bp.shortEffect}</p>
                        <p className="text-[10px] font-semibold text-[#7C5230]">
                          {bp.goldCost} Vàng · {bp.badgeCost} Huy Hiệu · Cấp {bp.unlockLevel}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectBuildStructure(bp.id);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shrink-0 cursor-pointer"
                      >
                        Chọn Đặt
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Livestock Barn */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E4726]">
                    Chuồng Trại ({state.livestock.length}/6) {state.autoFeederOwned ? '· Có Máng Ăn Tự Động' : ''}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => onBuyLivestock('chicken')}
                      className="px-2.5 py-1 rounded bg-[#D97706] text-white text-[11px] font-bold cursor-pointer"
                    >
                      + Gà Mái (140g)
                    </button>
                    <button
                      type="button"
                      onClick={() => onBuyLivestock('cow')}
                      className="px-2.5 py-1 rounded bg-[#6E4726] text-white text-[11px] font-bold cursor-pointer"
                    >
                      + Bò Sữa (220g)
                    </button>
                    <button
                      type="button"
                      onClick={() => onBuyLivestock('sheep')}
                      className="px-2.5 py-1 rounded bg-[#6E4726] text-white text-[11px] font-bold cursor-pointer"
                    >
                      + Cừu Mây (260g)
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {state.livestock.map((an) => (
                    <div
                      key={an.id}
                      className="p-2.5 rounded-xl border border-[#D6BE96] bg-[#FFFDF8] flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-xs font-bold">{an.name}</p>
                        <p className="text-[10px] text-[#7C5230]">
                          {an.productReady ? 'Có sản phẩm!' : an.fedToday ? 'Đã ăn no' : 'Đang đói'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onTendLivestock(an.id)}
                        className={`px-2 py-1 rounded text-[11px] font-bold text-white cursor-pointer ${
                          an.productReady ? 'bg-[#D97706]' : an.fedToday ? 'bg-[#94A3B8]' : 'bg-[#2E7D32]'
                        }`}
                      >
                        {an.productReady ? 'Thu Hoạch' : an.fedToday ? 'Đã No' : 'Cho Ăn'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. OFFLINE CATCH-UP REPORT */}
          {modal === 'offline' && offlineReport && (
            <div className="space-y-4">
              <p className="text-sm text-[#5C3A21]">
                Trong lúc bạn rời thung lũng khoảng{' '}
                <strong>{Math.max(1, Math.round(offlineReport.elapsedSeconds / 60))} phút</strong> (tối đa 12 giờ),
                nông trại vẫn tiếp tục vận hành nhịp nhàng:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#FFFDF8] border border-[#D6BE96] text-center">
                  <p className="text-2xl font-bold text-[#B45309] tabular-nums">{offlineReport.daysAdvanced}</p>
                  <p className="text-xs font-semibold text-[#5C3A21]">Ngày đã trôi qua</p>
                </div>
                <div className="p-3 rounded-xl bg-[#FFFDF8] border border-[#D6BE96] text-center">
                  <p className="text-2xl font-bold text-[#2E7D32] tabular-nums">{offlineReport.cropsMatured}</p>
                  <p className="text-xs font-semibold text-[#5C3A21]">Luống cây trưởng thành</p>
                </div>
                <div className="p-3 rounded-xl bg-[#FFFDF8] border border-[#D6BE96] text-center">
                  <p className="text-2xl font-bold text-[#0369A1] tabular-nums">{offlineReport.spriteHarvests}</p>
                  <p className="text-xs font-semibold text-[#5C3A21]">Nông sản Tinh Linh thu</p>
                </div>
                <div className="p-3 rounded-xl bg-[#FFFDF8] border border-[#D6BE96] text-center">
                  <p className="text-2xl font-bold text-[#9A3412] tabular-nums">{offlineReport.artisanCompleted}</p>
                  <p className="text-xs font-semibold text-[#5C3A21]">Mẻ xưởng hoàn tất</p>
                </div>
                <div className="p-3 rounded-xl bg-[#FFFDF8] border border-[#D6BE96] text-center col-span-2 sm:col-span-2">
                  <p className="text-lg font-bold text-[#7E22CE] tabular-nums">
                    {offlineReport.hybridsDiscovered.length > 0
                      ? offlineReport.hybridsDiscovered.map((id) => CROPS[id]?.name ?? id).join(', ')
                      : 'Chưa có giống đột biến mới'}
                  </p>
                  <p className="text-xs font-semibold text-[#5C3A21]">Khám phá Mầm Lai</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-sm font-bold cursor-pointer"
              >
                Tiếp Tục Canh Tác
              </button>
            </div>
          )}

          {/* 6. SETTINGS, AVATAR PROFILE, SAVE JSON & GUIDE */}
          {modal === 'settings' && (
            <div className="space-y-4">
              {/* Farmer Avatar Customization */}
              <div className="p-3.5 rounded-xl border border-[#D6BE96] bg-[#FFFDF8] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E4726]">
                  Tùy Chỉnh Nhân Vật Nông Dân Avatar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cv-farmer-name" className="block text-[11px] font-bold text-[#5C3A21] mb-1">
                      Tên Nhân Vật
                    </label>
                    <input
                      id="cv-farmer-name"
                      type="text"
                      maxLength={18}
                      value={state.farmerProfile?.name ?? 'Nông Dân Mây'}
                      onChange={(e) => onUpdateProfile({ name: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#C7AC82] bg-white text-xs font-bold text-[#2D1E12]"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[#5C3A21] mb-1">Kiểu Mũ</span>
                    <div className="flex flex-wrap gap-1.5">
                      {FARMER_HATS.map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => onUpdateProfile({ hat: h.id })}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                            state.farmerProfile?.hat === h.id
                              ? 'bg-[#6E4726] text-white'
                              : 'bg-[#F3E6CE] text-[#5C3A21]'
                          }`}
                        >
                          {h.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-[#5C3A21] mb-1">Màu Áo Nông Trại</span>
                  <div className="flex flex-wrap gap-2">
                    {FARMER_SHIRTS.map((sh) => (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() => onUpdateProfile({ shirtColor: sh.color })}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${
                          state.farmerProfile?.shirtColor === sh.color
                            ? 'border-[#2D1E12] bg-[#EFE2CB]'
                            : 'border-[#D6BE96] bg-white'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sh.color }} />
                        {sh.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#D6BE96] bg-[#FFFDF8] space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E4726]">
                  Lưu Trữ Cục Bộ (IndexedDB) & Xuất/Nhập File .JSON
                </h3>
                <p className="text-xs text-[#5C3A21]">
                  Tiến trình nông trại được tự động lưu liên tục vào IndexedDB trình duyệt để bạn tải lại trang hoặc chơi ngoại tuyến mà không mất dữ liệu.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onExportJson}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Xuất File Lưu (.json)
                  </button>
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#6E4726] hover:bg-[#52341A] text-white text-xs font-bold cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Nhập File .json
                    <input type="file" accept=".json,application/json" onChange={handleFileChange} className="hidden" />
                  </label>
                  {!confirmReset ? (
                    <button
                      type="button"
                      onClick={() => setConfirmReset(true)}
                      className="px-3 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                    >
                      Chơi Lại Từ Đầu
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmReset(false);
                        onResetSave();
                      }}
                      className="px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Xác Nhận Xóa Dữ Liệu Cũ
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#D6BE96] bg-[#F5E8D0] space-y-1.5 text-xs text-[#4A311D]">
                <p className="font-bold text-sm flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#B45309]" /> Hướng Dẫn Chơi Nông Trại Avatar
                </p>
                <p>• <strong>Di chuyển & Thao tác:</strong> Dùng <strong>WASD / Phím Mũi Tên</strong> (hoặc D-Pad) đi quanh vườn, bấm <strong>Space</strong> hoặc nút <strong>Tác Vụ</strong> để tự cuốc, tưới, gieo hạt, thu hoạch hay nói chuyện với Bác Lái Buôn.</p>
                <p>• <strong>Click / Chạm trực tiếp:</strong> Chạm vào ô đất, giếng nước, chuồng gà bò hay nhà kho để nhân vật chạy tới làm việc tự động!</p>
                <p>• <strong>Lai tạo giống hiếm:</strong> Đặt 2 cây trưởng thành khác loại cạnh ô đất cày trống (VD: Cà Chua + Ớt → Cà Chua Lửa).</p>
                <p>• <strong>Độ ẩm 60%–90%:</strong> Cây lớn nhanh +20%. Ghé <strong>Giếng Nước</strong> múc nước tưới mát toàn vườn bất cứ lúc nào.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
