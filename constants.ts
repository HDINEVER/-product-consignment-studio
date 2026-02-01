import { Product } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    title: '流萤 - 全息镭射明信片',
    ip: '崩坏：星穹铁道',
    category: '纸制品',
    image: 'https://picsum.photos/seed/firefly/400/500',
    description: '使用高克重珠光纸，表面覆全息镭射膜，光下呈现彩虹效果。',
    basePrice: 15,
    variants: [{ name: '单张', price: 15 }, { name: '一套(3张)', price: 40 }]
  },
  {
    id: '2',
    title: '芙宁娜 - 3D打印光固化白模',
    ip: '原神',
    category: '3D打印制品',
    image: 'https://picsum.photos/seed/furina/400/500',
    description: '8k精度光固化打印，未上色白模，需要自行打磨上色。',
    basePrice: 120,
    variants: [{ name: '1/8 比例', price: 120 }, { name: '1/6 比例', price: 180 }]
  },
  {
    id: '3',
    title: '初音未来 - 痛包吧唧套装',
    ip: '初音未来',
    category: '吧唧制品',
    image: 'https://picsum.photos/seed/miku/400/500',
    description: '75mm 细闪工艺徽章，包含底托和保护套。',
    basePrice: 25,
    variants: [{ name: 'A款：世界第一公主', price: 25 }, { name: 'B款：深海少女', price: 25 }]
  },
  {
    id: '4',
    title: '阿米娅 - 兔耳发箍 Cos道具',
    ip: '明日方舟',
    category: 'Cos道具/3D代打',
    image: 'https://picsum.photos/seed/amiya/400/500',
    description: '轻量化PLA打印，内置发箍骨架，还原度极高。',
    basePrice: 80,
    variants: [{ name: '标准版', price: 80 }, { name: '涂装完成版', price: 150 }]
  },
  {
    id: '5',
    title: '洁世一 - 亚克力立牌',
    ip: '蓝色监狱',
    category: '雪弗板定制',
    image: 'https://picsum.photos/seed/isagi/400/500',
    description: '实际上是高密度雪弗板UV直喷，比亚克力更轻便，不易碎。',
    basePrice: 35,
    variants: [{ name: '15cm立牌', price: 35 }, { name: '20cm立牌', price: 45 }]
  },
  {
    id: '6',
    title: '日向翔阳 - 飞吧 立体相框',
    ip: '排球少年',
    category: '角色手办定制',
    image: 'https://picsum.photos/seed/haikyu/400/500',
    description: '包含Q版手办与背景相框的组合场景。',
    basePrice: 200,
    variants: [{ name: '成品', price: 200 }]
  },
  {
    id: '7',
    title: '钟离 - 岩神像 1/10',
    ip: '原神',
    category: '角色手办定制',
    image: 'https://picsum.photos/seed/zhongli/400/500',
    description: '树脂翻模成品，精细涂装。',
    basePrice: 450,
    variants: [{ name: '岩王帝君', price: 450 }]
  },
  {
    id: '8',
    title: '卡芙卡 - 悬赏令海报',
    ip: '崩坏：星穹铁道',
    category: '纸制品',
    image: 'https://picsum.photos/seed/kafka/400/500',
    description: '复古牛皮纸风格，A3尺寸。',
    basePrice: 10,
    variants: [{ name: '单张', price: 10 }, { name: '带海报筒', price: 15 }]
  },
];
