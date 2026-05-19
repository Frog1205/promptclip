import { LibraryData } from '../types'

const defaultTemplates = [
  {
    id: 'tpl-1',
    name: '高原动物徽章',
    subject: '雪豹',
    style: '可爱卡通风格',
    details: ['五色经幡', '远处雪山', '1:1 方形构图', '温暖明亮'],
  },
  {
    id: 'tpl-2',
    name: '石渠文创明信片',
    subject: '藏式糌粑盒',
    style: '水彩风格',
    details: ['扎溪卡草原', '藏八宝纹样', '明信片A6横式尺寸', '温暖明亮'],
  },
  {
    id: 'tpl-3',
    name: '藏文化角色设计',
    subject: '格萨尔王',
    style: '藏式插画风格',
    details: ['藏八宝纹样', '主体居中', '温暖明亮'],
  },
  {
    id: 'tpl-4',
    name: '星空草原插画',
    subject: '银河',
    style: '童话风格',
    details: ['扎溪卡草原', '星空银河', '天空有飘动的云朵', '温暖明亮'],
  },
]

const subjects = [
  '牦牛',
  '藏族小朋友',
  '藏族男孩',
  '藏族女孩',
  '藏式白塔',
  '高原兔',
  '藏羚羊',
  '雄鹰',
  '雪山',
  '藏式糌粑盒',
  '藏族奶茶壶',
  '藏族朝圣者',
  '藏族转经筒',
  '雪豹',
  '黑颈鹤',
  '藏獒',
  '马',
  '藏式帐篷',
  '格萨尔王',
  '藏戏面具',
  '酥油花',
  '酥油灯',
  '青稞穗',
  '星空',
  '银河',
]

const styles = [
  '藏式插画风格',
  '可爱卡通风格',
  '唐卡风格',
  '水彩风格',
  '油画风格',
  '绘本风格',
  '国画风格',
  '皮影风格',
  '剪纸风格',
  '童话风格',
  '涂鸦风格',
  '蜡笔风格',
  '彩铅风格',
  '刺绣风格',
  '儿童简笔画风格',
  '摄影风格',
]

const details = [
  '五色经幡',
  '远处雪山',
  '扎溪卡草原',
  '夕阳金光',
  '星空银河',
  '藏八宝纹样',
  '牦牛脖子上的铃铛',
  '草地上有野花',
  '小溪流',
  '天空有飘动的云朵',
  '彩虹',
  '1:1 方形构图',
  '明信片A6横式尺寸',
  '主体居中',
  '温暖明亮',
]

function toWordItems(prefix: string, items: string[]) {
  return items.map((text, index) => ({
    id: `${prefix}-${index + 1}`,
    text,
  }))
}

export function getDefaultLibrary(): LibraryData {
  return {
    subjects: toWordItems('sub', subjects),
    styles: toWordItems('sty', styles),
    details: toWordItems('det', details),
    templates: defaultTemplates,
  }
}
