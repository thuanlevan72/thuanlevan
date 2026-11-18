---
name: "Fresh Botanical & Cyber Wood (Mệnh Mộc 2002)"
description: "Hệ thống thiết kế Mệnh Mộc hiện đại, tươi sáng tràn đầy sinh khí, hỗ trợ đầy đủ 2 chế độ Sáng (Tinh khôi, ngọc bích, sương mai) và Tối (Biển sâu huyền bí)."
---

## Overview

Thiết kế giao diện mang đậm linh hồn sinh sôi nảy nở của **Mộc**: tươi mới, tràn ngập ánh sáng tự nhiên và sinh khí. Thay vì gam màu u tối, hệ thống lấy cảm hứng từ khu vườn công nghệ buổi sớm:
- **Light Mode (Chế độ Sáng - Mặc định phong thủy cực thịnh):** Nền trắng sương mai ngả xanh ngọc nhạt (`#F6FBF7`, `#FFFFFF`), kết hợp xanh ngọc bảo đậm chuẩn tương phản (`#047857`, `#065F46`), xanh biển sâu (`#0369A1`) mang lại sự tinh khôi, trong trẻo và dễ đọc tuyệt đối.
- **Dark Mode (Chế độ Tối - Deep Forest):** Nền xanh đen rừng sâu và đại dương thẫm (`#08101C`, `#0F1D30`) bảo vệ mắt, tôn lên ánh sáng sinh học của các vi mạch.
- **Tính năng chuyển đổi tức thì (Theme Toggle):** Người dùng và nhà tuyển dụng có thể tự do bấm chuyển đổi Light / Dark mode ngay trên thanh điều hướng chỉ bằng một click.

## Colors

Bảng màu ngũ hành tươi sáng tương sinh:
- **Primary:** Forest Emerald (`#047857` ở Light mode, `#10B981` ở Dark mode) tượng trưng cho cây cối đâm chồi nảy lộc.
- **Secondary / Cyan (Thủy):** Deep Ocean Blue (`#0369A1` ở Light, `#38BDF8` ở Dark) tượng trưng cho nguồn nước thanh khiết tưới mát cho cây.
- **Accent:** Royal Blue (`#4338CA` / `#818CF8`) mang lại sự tinh tế công nghệ cao.

```yaml
colors:
  accent: "#4338CA"
  success: "#047857"
  warning: "#B45309"
  error: "#B91C1C"
  cyan: "#0369A1"
  light:
    primary: "#047857"
    on-primary: "#FFFFFF"
    surface: "#F8FCF9"
    on-surface: "#0F172A"
    surface-variant: "#FFFFFF"
    on-surface-variant: "#334155"
    outline: "#94A3B8"
  dark:
    primary: "#10B981"
    on-primary: "#022C22"
    surface: "#08101C"
    on-surface: "#F1F5F9"
    surface-variant: "#0F1D30"
    on-surface-variant: "#94A3B8"
    outline: "#1E3A5F"
```

## Typography

Sử dụng bộ đôi **Space Grotesk** kết hợp **Geist** và **Space Mono**:

```yaml
typography:
  display-lg:
    fontFamily: "Space Grotesk"
    fontSize: 56px
    fontWeight: 700
    lineHeight: 64px
    letterSpacing: -1.5px
  display-lg-mobile:
    fontFamily: "Space Grotesk"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 40px
    letterSpacing: -0.75px
  headline-xl:
    fontFamily: "Space Grotesk"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 48px
    letterSpacing: -1px
  headline-xl-mobile:
    fontFamily: "Space Grotesk"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 36px
    letterSpacing: -0.5px
  headline-lg:
    fontFamily: "Space Grotesk"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 36px
    letterSpacing: -0.5px
  headline-lg-mobile:
    fontFamily: "Space Grotesk"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 30px
    letterSpacing: -0.25px
  headline-md:
    fontFamily: "Space Grotesk"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: -0.25px
  body-lg:
    fontFamily: "Geist"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 28px
    letterSpacing: 0px
  body-md:
    fontFamily: "Geist"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  body-sm:
    fontFamily: "Geist"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px
  label-lg:
    fontFamily: "Geist"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0.1px
  label-sm:
    fontFamily: "Space Mono"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.5px
```

## Layout & Spacing

Lưới 12 cột thoáng đãng, nhiều khoảng thở trắng (negative space) đem lại cảm giác tự do, dễ chịu.

```yaml
spacing:
  gutter-xs: 4px
  gutter-sm: 8px
  gutter-md: 16px
  gutter-lg: 24px
  gutter-xl: 32px
  section: 64px
  page-margin: 24px
```

## Elevation & Depth

- **Light Mode:** Đổ bóng nhẹ nhàng mềm mại (`box-shadow: 0 10px 30px -5px rgba(4, 120, 87, 0.08)`), viền mỏng thanh mảnh màu ngọc nhạt.
- **Dark Mode:** Đèn phát quang sinh học neon xanh dịu mắt.

## Shapes

Bo góc lớn 12px - 16px mang nét hữu cơ nhẹ nhàng như lá cây.

```yaml
rounded:
  sm: 4px
  DEFAULT: 8px
  md: 12px
  lg: 16px
  xl: 20px
  full: 9999px
```

## Motion & Micro-interaction

Hiệu ứng chuyển đổi theme mượt mà giữa ngày và đêm, hiệu ứng vươn chồi non khi hover vào các thẻ kỹ thuật.

```yaml
motion:
  state-change:
    duration: 150ms
    delay: 0ms
    timingFunction: cubic-bezier(0.16, 1, 0.3, 1)
  surface-enter:
    duration: 250ms
    delay: 0ms
    timingFunction: cubic-bezier(0.16, 1, 0.3, 1)
  surface-exit:
    duration: 150ms
    delay: 0ms
    timingFunction: cubic-bezier(0.3, 0, 1, 1)
```

## Components

- `components/button.html`
- `components/card.html`
- `components/badge.html`
- `components/input-field.html`
