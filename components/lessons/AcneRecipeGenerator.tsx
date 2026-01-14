'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, X, RefreshCw, Download, ChefHat, AlertCircle, CheckCircle2, Shuffle } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import Image from 'next/image'

interface Ingredient {
  name: string
  quantity: string
  checked: boolean
}

interface Recipe {
  id: string
  name: string
  description: string
  image?: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ingredients: Ingredient[]
  instructions: string[]
  calories: number
  fats: number
  proteins: number
  carbs: number
  prepTime: number
  difficulty: 'Простой' | 'Средний' | 'Сложный'
  benefits: string[] // Польза для кожи
}

const ALL_RECIPES: Recipe[] = [
  // Завтраки
  {
    id: 'breakfast-1',
    name: 'Яичница с авокадо и шпинатом',
    description: 'Богата омега-3, витаминами и антиоксидантами для чистой кожи',
    mealType: 'breakfast',
    ingredients: [
      { name: 'Яйца', quantity: '3 шт', checked: false },
      { name: 'Авокадо', quantity: '1/2 шт', checked: false },
      { name: 'Шпинат свежий', quantity: '50г', checked: false },
      { name: 'Оливковое масло', quantity: '1 ст.л.', checked: false },
      { name: 'Соль, перец', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Нарежьте авокадо кубиками',
      'Промойте и обсушите шпинат',
      'Разогрейте оливковое масло на сковороде',
      'Взбейте яйца, вылейте на сковороду',
      'Добавьте шпинат за минуту до готовности',
      'Подавайте с авокадо, посолите и поперчите',
    ],
    calories: 420,
    fats: 32,
    proteins: 22,
    carbs: 8,
    prepTime: 15,
    difficulty: 'Простой',
    benefits: ['Омега-3 для противовоспалительного эффекта', 'Витамин E для восстановления кожи', 'Антиоксиданты из шпината']
  },
  {
    id: 'breakfast-2',
    name: 'Смузи с кокосовым маслом и шпинатом',
    description: 'Противовоспалительный смузи с лауриновой кислотой для чистой кожи',
    mealType: 'breakfast',
    ingredients: [
      { name: 'Кокосовое молоко', quantity: '50мл', checked: false },
      { name: 'Кокосовое масло', quantity: '1 ст.л.', checked: false },
      { name: 'Коллаген или протеин', quantity: '30г', checked: false },
      { name: 'Шпинат', quantity: '50г', checked: false },
      { name: 'Лимонный сок', quantity: '1 ст.л.', checked: false },
      { name: 'Лед', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Поместите все ингредиенты в блендер',
      'Взбейте до однородной консистенции',
      'Добавьте лед и еще раз взбейте',
      'Подавайте сразу',
    ],
    calories: 380,
    fats: 28,
    proteins: 30,
    carbs: 5,
    prepTime: 5,
    difficulty: 'Простой',
    benefits: ['Лауриновая кислота (антибактериальное)', 'Коллаген для упругости кожи', 'Антиоксиданты']
  },
  // Обеды
  {
    id: 'lunch-1',
    name: 'Лосось с овощами и авокадо',
    description: 'Богат омега-3, противовоспалительными жирами и витаминами',
    mealType: 'lunch',
    ingredients: [
      { name: 'Филе лосося', quantity: '200г', checked: false },
      { name: 'Авокадо', quantity: '1/2 шт', checked: false },
      { name: 'Салат руккола', quantity: '50г', checked: false },
      { name: 'Огурцы', quantity: '1 шт', checked: false },
      { name: 'Оливковое масло', quantity: '2 ст.л.', checked: false },
      { name: 'Лимонный сок', quantity: '1 ст.л.', checked: false },
      { name: 'Соль, перец', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Разогрейте оливковое масло на сковороде',
      'Посолите и поперчите лосось',
      'Обжарьте лосось по 4-5 минут с каждой стороны',
      'Нарежьте авокадо и огурцы',
      'Выложите салат на тарелку, добавьте овощи и лосось',
      'Полейте оливковым маслом и лимонным соком',
    ],
    calories: 550,
    fats: 42,
    proteins: 38,
    carbs: 6,
    prepTime: 20,
    difficulty: 'Средний',
    benefits: ['Омега-3 для уменьшения воспаления', 'Витамины группы B', 'Антиоксиданты']
  },
  {
    id: 'lunch-2',
    name: 'Салат с тунцом и авокадо',
    description: 'Легкий и питательный салат с противовоспалительными жирами',
    mealType: 'lunch',
    ingredients: [
      { name: 'Тунец консервированный (в масле)', quantity: '1 банка (200г)', checked: false },
      { name: 'Авокадо', quantity: '1/2 шт', checked: false },
      { name: 'Огурцы', quantity: '1 шт', checked: false },
      { name: 'Листья салата', quantity: '50г', checked: false },
      { name: 'Оливковое масло', quantity: '2 ст.л.', checked: false },
      { name: 'Лимонный сок', quantity: '1 ст.л.', checked: false },
    ],
    instructions: [
      'Слейте масло с тунца, разомните вилкой',
      'Нарежьте авокадо и огурцы кубиками',
      'Смешайте все ингредиенты с листьями салата',
      'Заправьте оливковым маслом и лимонным соком',
    ],
    calories: 480,
    fats: 35,
    proteins: 28,
    carbs: 8,
    prepTime: 15,
    difficulty: 'Простой',
    benefits: ['Белок для восстановления', 'Противовоспалительные жиры', 'Витамин C']
  },
  {
    id: 'lunch-3',
    name: 'Куриная грудка с брокколи',
    description: 'Богата белком и антиоксидантами, без воспалительных продуктов',
    mealType: 'lunch',
    ingredients: [
      { name: 'Куриная грудка', quantity: '250г', checked: false },
      { name: 'Брокколи', quantity: '200г', checked: false },
      { name: 'Кокосовое масло', quantity: '30г', checked: false },
      { name: 'Чеснок', quantity: '2 зубчика', checked: false },
      { name: 'Соль, перец', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Нарежьте куриную грудку на кусочки',
      'Разогрейте кокосовое масло на сковороде',
      'Обжарьте курицу до золотистой корочки',
      'Добавьте брокколи и чеснок, обжаривайте 5 минут',
      'Посолите и поперчите по вкусу',
    ],
    calories: 520,
    fats: 32,
    proteins: 48,
    carbs: 7,
    prepTime: 25,
    difficulty: 'Средний',
    benefits: ['Белок для восстановления тканей', 'Сульфорафан из брокколи (противовоспалительное)', 'Антиоксиданты']
  },
  // Ужины
  {
    id: 'dinner-1',
    name: 'Стейк из говядины с овощами',
    description: 'Богат цинком и железом, важными для здоровья кожи',
    mealType: 'dinner',
    ingredients: [
      { name: 'Говядина (стейк)', quantity: '200г', checked: false },
      { name: 'Кабачки', quantity: '150г', checked: false },
      { name: 'Грибы', quantity: '100г', checked: false },
      { name: 'Оливковое масло', quantity: '2 ст.л.', checked: false },
      { name: 'Соль, перец', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Разогрейте сковороду с оливковым маслом',
      'Посолите и поперчите стейк',
      'Обжарьте стейк по 4-5 минут с каждой стороны',
      'Нарежьте кабачки и грибы',
      'Обжарьте овощи на той же сковороде',
      'Подавайте сразу',
    ],
    calories: 580,
    fats: 45,
    proteins: 40,
    carbs: 6,
    prepTime: 25,
    difficulty: 'Средний',
    benefits: ['Цинк для заживления', 'Железо для здорового цвета', 'Белок для коллагена']
  },
  {
    id: 'dinner-2',
    name: 'Креветки в чесночном масле с овощами',
    description: 'Легкое блюдо с противовоспалительными свойствами',
    mealType: 'dinner',
    ingredients: [
      { name: 'Креветки крупные', quantity: '300г', checked: false },
      { name: 'Чеснок', quantity: '4 зубчика', checked: false },
      { name: 'Кокосовое масло', quantity: '40г', checked: false },
      { name: 'Шпинат', quantity: '100г', checked: false },
      { name: 'Лимон', quantity: '1/2 шт', checked: false },
      { name: 'Соль, перец', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Очистите креветки от панциря',
      'Разогрейте кокосовое масло',
      'Обжарьте чеснок 1 минуту',
      'Добавьте креветки, жарьте 3-4 минуты',
      'Добавьте шпинат, жарьте еще 1 минуту',
      'Подавайте с лимонным соком',
    ],
    calories: 350,
    fats: 22,
    proteins: 32,
    carbs: 4,
    prepTime: 15,
    difficulty: 'Простой',
    benefits: ['Омега-3 из креветок', 'Антиоксиданты из чеснока', 'Витамины из шпината']
  },
  {
    id: 'dinner-3',
    name: 'Рыба на пару с цветной капустой',
    description: 'Нежное блюдо, богатое омега-3 и витаминами',
    mealType: 'dinner',
    ingredients: [
      { name: 'Белая рыба (треска/пикша)', quantity: '250г', checked: false },
      { name: 'Цветная капуста', quantity: '200г', checked: false },
      { name: 'Оливковое масло', quantity: '2 ст.л.', checked: false },
      { name: 'Лимон', quantity: '1/4 шт', checked: false },
      { name: 'Укроп свежий', quantity: '2 ст.л.', checked: false },
      { name: 'Соль, перец', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Подготовьте пароварку или мультиварку',
      'Разделите цветную капусту на соцветия',
      'Посолите и поперчите рыбу',
      'Готовьте на пару 15-20 минут',
      'Подавайте с оливковым маслом, лимоном и укропом',
    ],
    calories: 420,
    fats: 28,
    proteins: 35,
    carbs: 8,
    prepTime: 20,
    difficulty: 'Простой',
    benefits: ['Омега-3', 'Антиоксиданты', 'Низкий гликемический индекс']
  },
  // Перекусы
  {
    id: 'snack-1',
    name: 'Авокадо с орехами макадамия',
    description: 'Быстрый перекус с противовоспалительными жирами',
    mealType: 'snack',
    ingredients: [
      { name: 'Авокадо', quantity: '1/2 шт', checked: false },
      { name: 'Орехи макадамия', quantity: '20г', checked: false },
      { name: 'Лимонный сок', quantity: 'несколько капель', checked: false },
      { name: 'Соль', quantity: 'щепотка', checked: false },
    ],
    instructions: [
      'Разрежьте авокадо пополам',
      'Посыпьте орехами макадамия',
      'Сбрызните лимонным соком',
      'Посолите по вкусу',
    ],
    calories: 280,
    fats: 25,
    proteins: 4,
    carbs: 6,
    prepTime: 3,
    difficulty: 'Простой',
    benefits: ['Мононенасыщенные жиры', 'Витамин E', 'Низкий омега-6']
  },
  // Дополнительные завтраки
  {
    id: 'breakfast-3',
    name: 'Омлет со шпинатом и авокадо',
    description: 'Богат белком и антиоксидантами для здоровья кожи',
    mealType: 'breakfast',
    ingredients: [
      { name: 'Яйца', quantity: '3 шт', checked: false },
      { name: 'Шпинат свежий', quantity: '80г', checked: false },
      { name: 'Авокадо', quantity: '1/2 шт', checked: false },
      { name: 'Кокосовое масло', quantity: '1 ст.л.', checked: false },
      { name: 'Соль, перец', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Взбейте яйца с солью и перцем',
      'Нарежьте авокадо кубиками',
      'Разогрейте кокосовое масло на сковороде',
      'Добавьте шпинат и обжаривайте 1 минуту',
      'Влейте яйца и готовьте 2-3 минуты',
      'Подавайте с авокадо',
    ],
    calories: 410,
    fats: 30,
    proteins: 24,
    carbs: 7,
    prepTime: 12,
    difficulty: 'Простой',
    benefits: ['Белок для восстановления', 'Антиоксиданты', 'Противовоспалительные жиры']
  },
  {
    id: 'breakfast-4',
    name: 'Чиа-пудинг с кокосовым молоком',
    description: 'Богат омега-3 и клетчаткой для чистой кожи',
    mealType: 'breakfast',
    ingredients: [
      { name: 'Семена чиа', quantity: '3 ст.л.', checked: false },
      { name: 'Кокосовое молоко', quantity: '200мл', checked: false },
      { name: 'Кокосовое масло', quantity: '1 ч.л.', checked: false },
      { name: 'Ваниль', quantity: 'щепотка', checked: false },
    ],
    instructions: [
      'Смешайте семена чиа с кокосовым молоком',
      'Добавьте кокосовое масло и ваниль',
      'Тщательно перемешайте',
      'Оставьте на ночь в холодильнике',
      'Подавайте охлажденным',
    ],
    calories: 320,
    fats: 26,
    proteins: 8,
    carbs: 12,
    prepTime: 5,
    difficulty: 'Простой',
    benefits: ['Омега-3 из чиа', 'Лауриновая кислота', 'Клетчатка']
  },
  // Дополнительные обеды
  {
    id: 'lunch-4',
    name: 'Салат с курицей и авокадо',
    description: 'Сбалансированное блюдо с противовоспалительными свойствами',
    mealType: 'lunch',
    ingredients: [
      { name: 'Куриная грудка (запеченная)', quantity: '200г', checked: false },
      { name: 'Авокадо', quantity: '1 шт', checked: false },
      { name: 'Огурцы', quantity: '1 шт', checked: false },
      { name: 'Листья салата', quantity: '100г', checked: false },
      { name: 'Оливковое масло', quantity: '2 ст.л.', checked: false },
      { name: 'Лимонный сок', quantity: '1 ст.л.', checked: false },
      { name: 'Соль, перец', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Нарежьте курицу на кусочки',
      'Нарежьте авокадо и огурцы',
      'Смешайте с листьями салата',
      'Заправьте оливковым маслом и лимонным соком',
      'Посолите и поперчите',
    ],
    calories: 520,
    fats: 38,
    proteins: 42,
    carbs: 8,
    prepTime: 15,
    difficulty: 'Простой',
    benefits: ['Белок для восстановления', 'Противовоспалительные жиры', 'Витамины']
  },
  {
    id: 'lunch-5',
    name: 'Цветная капуста с курицей',
    description: 'Богата антиоксидантами и белком для здоровья кожи',
    mealType: 'lunch',
    ingredients: [
      { name: 'Куриная грудка', quantity: '250г', checked: false },
      { name: 'Цветная капуста', quantity: '300г', checked: false },
      { name: 'Кокосовое масло', quantity: '30г', checked: false },
      { name: 'Чеснок', quantity: '3 зубчика', checked: false },
      { name: 'Куркума', quantity: '1 ч.л.', checked: false },
      { name: 'Соль, перец', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Нарежьте курицу на кусочки',
      'Разделите капусту на соцветия',
      'Разогрейте кокосовое масло',
      'Обжарьте курицу до золотистого цвета',
      'Добавьте капусту, чеснок и куркуму',
      'Тушите 10-12 минут до готовности',
    ],
    calories: 480,
    fats: 30,
    proteins: 46,
    carbs: 10,
    prepTime: 25,
    difficulty: 'Средний',
    benefits: ['Куркумин (противовоспалительное)', 'Белок', 'Антиоксиданты']
  },
  {
    id: 'lunch-6',
    name: 'Говядина с брокколи и грибами',
    description: 'Богат цинком и антиоксидантами для чистой кожи',
    mealType: 'lunch',
    ingredients: [
      { name: 'Говядина (нарезанная)', quantity: '200г', checked: false },
      { name: 'Брокколи', quantity: '200г', checked: false },
      { name: 'Грибы шампиньоны', quantity: '150г', checked: false },
      { name: 'Кокосовое масло', quantity: '30г', checked: false },
      { name: 'Чеснок', quantity: '2 зубчика', checked: false },
      { name: 'Соль, перец', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Нарежьте говядину тонкими полосками',
      'Разогрейте кокосовое масло на сковороде',
      'Обжарьте говядину 5-6 минут',
      'Добавьте грибы и чеснок, жарьте 3 минуты',
      'Добавьте брокколи и готовьте еще 5 минут',
      'Посолите и поперчите',
    ],
    calories: 560,
    fats: 38,
    proteins: 48,
    carbs: 9,
    prepTime: 25,
    difficulty: 'Средний',
    benefits: ['Цинк для заживления', 'Сульфорафан', 'Белок']
  },
  // Дополнительные ужины
  {
    id: 'dinner-4',
    name: 'Запеченный лосось с овощами',
    description: 'Богат омега-3 для уменьшения воспалений',
    mealType: 'dinner',
    ingredients: [
      { name: 'Филе лосося', quantity: '250г', checked: false },
      { name: 'Кабачки', quantity: '200г', checked: false },
      { name: 'Брокколи', quantity: '150г', checked: false },
      { name: 'Оливковое масло', quantity: '2 ст.л.', checked: false },
      { name: 'Лимон', quantity: '1/2 шт', checked: false },
      { name: 'Укроп', quantity: '2 ст.л.', checked: false },
      { name: 'Соль, перец', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Разогрейте духовку до 200°C',
      'Нарежьте овощи',
      'Выложите лосось и овощи на противень',
      'Полейте оливковым маслом, посолите, поперчите',
      'Запекайте 20 минут',
      'Подавайте с лимоном и укропом',
    ],
    calories: 520,
    fats: 36,
    proteins: 42,
    carbs: 8,
    prepTime: 25,
    difficulty: 'Средний',
    benefits: ['Омега-3', 'Противовоспалительные жиры', 'Витамины']
  },
  {
    id: 'dinner-5',
    name: 'Куриные бедра с цветной капустой',
    description: 'Богата белком и антиоксидантами',
    mealType: 'dinner',
    ingredients: [
      { name: 'Куриные бедра', quantity: '300г', checked: false },
      { name: 'Цветная капуста', quantity: '300г', checked: false },
      { name: 'Кокосовое масло', quantity: '30г', checked: false },
      { name: 'Розмарин', quantity: '1 веточка', checked: false },
      { name: 'Чеснок', quantity: '3 зубчика', checked: false },
      { name: 'Соль, перец', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Разогрейте духовку до 180°C',
      'Разделите капусту на соцветия',
      'Выложите курицу и капусту в форму',
      'Добавьте кокосовое масло, розмарин, чеснок',
      'Посолите и поперчите',
      'Запекайте 40-45 минут',
    ],
    calories: 620,
    fats: 42,
    proteins: 52,
    carbs: 10,
    prepTime: 50,
    difficulty: 'Средний',
    benefits: ['Белок', 'Антиоксиданты', 'Здоровые жиры']
  },
  {
    id: 'dinner-6',
    name: 'Рыбный салат с авокадо',
    description: 'Легкое блюдо, богатое омега-3',
    mealType: 'dinner',
    ingredients: [
      { name: 'Филе белой рыбы (запеченное)', quantity: '200г', checked: false },
      { name: 'Авокадо', quantity: '1 шт', checked: false },
      { name: 'Огурцы', quantity: '1 шт', checked: false },
      { name: 'Листья салата', quantity: '100г', checked: false },
      { name: 'Оливковое масло', quantity: '2 ст.л.', checked: false },
      { name: 'Лимонный сок', quantity: '1 ст.л.', checked: false },
      { name: 'Укроп', quantity: '2 ст.л.', checked: false },
      { name: 'Соль, перец', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Запеките рыбу в духовке 20 минут',
      'Нарежьте авокадо и огурцы',
      'Разломайте рыбу на кусочки',
      'Смешайте с листьями салата',
      'Заправьте оливковым маслом и лимонным соком',
      'Посыпьте укропом, посолите и поперчите',
    ],
    calories: 480,
    fats: 34,
    proteins: 38,
    carbs: 9,
    prepTime: 25,
    difficulty: 'Простой',
    benefits: ['Омега-3', 'Легкое усвоение', 'Витамины']
  },
  // Дополнительные перекусы
  {
    id: 'snack-2',
    name: 'Огуречные рулетики с авокадо',
    description: 'Быстрый перекус с противовоспалительными жирами',
    mealType: 'snack',
    ingredients: [
      { name: 'Огурец', quantity: '1 шт', checked: false },
      { name: 'Авокадо', quantity: '1/2 шт', checked: false },
      { name: 'Лимонный сок', quantity: '1 ч.л.', checked: false },
      { name: 'Укроп', quantity: '1 ст.л.', checked: false },
      { name: 'Соль', quantity: 'щепотка', checked: false },
    ],
    instructions: [
      'Нарежьте огурец тонкими полосками',
      'Разомните авокадо вилкой',
      'Добавьте лимонный сок, укроп и соль',
      'Выложите авокадо на огуречные полоски',
      'Сверните в рулетики',
    ],
    calories: 180,
    fats: 15,
    proteins: 3,
    carbs: 8,
    prepTime: 5,
    difficulty: 'Простой',
    benefits: ['Противовоспалительные жиры', 'Низкокалорийно', 'Витамины']
  },
  {
    id: 'snack-3',
    name: 'Рыбные котлеты из лосося',
    description: 'Богаты омега-3 для здоровья кожи',
    mealType: 'snack',
    ingredients: [
      { name: 'Филе лосося', quantity: '200г', checked: false },
      { name: 'Лук репчатый', quantity: '1/4 шт', checked: false },
      { name: 'Кокосовое масло', quantity: '2 ст.л.', checked: false },
      { name: 'Укроп', quantity: '2 ст.л.', checked: false },
      { name: 'Соль, перец', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Пропустите лосось через мясорубку',
      'Мелко нарежьте лук и укроп',
      'Смешайте все ингредиенты',
      'Сформируйте котлеты',
      'Обжарьте на кокосовом масле по 4-5 минут с каждой стороны',
    ],
    calories: 380,
    fats: 28,
    proteins: 32,
    carbs: 3,
    prepTime: 20,
    difficulty: 'Средний',
    benefits: ['Омега-3', 'Белок', 'Противовоспалительные жиры']
  },
  {
    id: 'snack-4',
    name: 'Шпинатный смузи с авокадо',
    description: 'Питательный напиток с антиоксидантами',
    mealType: 'snack',
    ingredients: [
      { name: 'Шпинат свежий', quantity: '100г', checked: false },
      { name: 'Авокадо', quantity: '1/2 шт', checked: false },
      { name: 'Кокосовое молоко', quantity: '150мл', checked: false },
      { name: 'Лимонный сок', quantity: '1 ст.л.', checked: false },
      { name: 'Лед', quantity: 'по вкусу', checked: false },
    ],
    instructions: [
      'Поместите все ингредиенты в блендер',
      'Взбейте до однородной консистенции',
      'Добавьте лед и взбейте еще раз',
      'Подавайте сразу',
    ],
    calories: 320,
    fats: 26,
    proteins: 6,
    carbs: 12,
    prepTime: 5,
    difficulty: 'Простой',
    benefits: ['Антиоксиданты', 'Противовоспалительные жиры', 'Витамины']
  },
]

const COMMON_ALLERGENS = [
  'Яйца',
  'Рыба',
  'Морепродукты',
  'Орехи',
  'Молочные продукты',
  'Помидоры',
  'Перец',
]

export function AcneRecipeGenerator() {
  const [selectedMealType, setSelectedMealType] = useState<'all' | Recipe['mealType']>('all')
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([])
  const [customExclusions, setCustomExclusions] = useState<string[]>([])
  const [newExclusion, setNewExclusion] = useState('')
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>(ALL_RECIPES)
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([])
  const [dishCount, setDishCount] = useState(1)
  const [downloading, setDownloading] = useState(false)

  // Фильтрация доступных рецептов по типу приема пищи и исключенным ингредиентам
  useEffect(() => {
    let filtered = [...ALL_RECIPES]

    // Фильтр по типу приема пищи
    if (selectedMealType !== 'all') {
      filtered = filtered.filter(r => r.mealType === selectedMealType)
    }

    // Фильтр по исключенным ингредиентам
    const allExclusions = [...excludedIngredients, ...customExclusions]
    if (allExclusions.length > 0) {
      filtered = filtered.filter(recipe => {
        return !recipe.ingredients.some(ing => 
          allExclusions.some(excluded => 
            ing.name.toLowerCase().includes(excluded.toLowerCase()) ||
            excluded.toLowerCase().includes(ing.name.toLowerCase())
          )
        )
      })
    }

    setAvailableRecipes(filtered)
  }, [selectedMealType, excludedIngredients, customExclusions])

  const toggleExclusion = (ingredient: string) => {
    if (excludedIngredients.includes(ingredient)) {
      setExcludedIngredients(excludedIngredients.filter(i => i !== ingredient))
    } else {
      setExcludedIngredients([...excludedIngredients, ingredient])
    }
  }

  const addCustomExclusion = () => {
    if (newExclusion.trim() && !customExclusions.includes(newExclusion.trim()) && !excludedIngredients.includes(newExclusion.trim())) {
      setCustomExclusions([...customExclusions, newExclusion.trim()])
      setNewExclusion('')
    }
  }

  const removeCustomExclusion = (item: string) => {
    setCustomExclusions(customExclusions.filter(i => i !== item))
  }

  const generateRandomRecipes = () => {
    if (availableRecipes.length === 0) {
      alert('Нет доступных рецептов с текущими фильтрами. Попробуйте изменить фильтры.')
      return
    }
    
    const count = Math.min(dishCount, availableRecipes.length)
    const selected: Recipe[] = []
    const available = [...availableRecipes]
    
    // Генерируем уникальные рецепты
    for (let i = 0; i < count; i++) {
      if (available.length === 0) break
      const randomIndex = Math.floor(Math.random() * available.length)
      selected.push(available[randomIndex])
      available.splice(randomIndex, 1) // Убираем выбранный рецепт
    }
    
    setGeneratedRecipes(selected)
    
    // Прокрутка к первому сгенерированному рецепту
    setTimeout(() => {
      const element = document.getElementById(`recipe-${selected[0].id}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const downloadPDF = async () => {
    if (generatedRecipes.length === 0) {
      alert('Сначала сгенерируйте рецепты!')
      return
    }

    try {
      setDownloading(true)

      // Создаем временный HTML элемент для PDF
      const printContent = document.createElement('div')
      printContent.style.position = 'absolute'
      printContent.style.left = '-9999px'
      printContent.style.width = '800px'
      printContent.style.padding = '40px'
      printContent.style.backgroundColor = '#ffffff'
      printContent.style.fontFamily = 'Arial, sans-serif'
      printContent.style.color = '#000000'

      // Заголовок документа
      printContent.innerHTML = `
        <h1 style="font-size: 28px; color: #3b82f6; text-align: center; margin-bottom: 10px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          Рецепты для чистой кожи
        </h1>
        <p style="text-align: center; color: #666666; font-size: 14px; margin-bottom: 20px;">
          Кето-рационы для борьбы с акне
        </p>
        ${excludedIngredients.length > 0 || customExclusions.length > 0 ? `
        <div style="background-color: #ffe0e0; padding: 10px; border-left: 4px solid #c80000; margin-bottom: 20px; color: #c80000; font-size: 12px;">
          <strong>Исключено:</strong> ${[...excludedIngredients, ...customExclusions].join(', ')}
        </div>
        ` : ''}
      `

      // Добавляем рецепты
      generatedRecipes.forEach((recipe, index) => {
        const mealTypeText = recipe.mealType === 'breakfast' ? 'Завтрак' : 
                            recipe.mealType === 'lunch' ? 'Обед' : 
                            recipe.mealType === 'dinner' ? 'Ужин' : 'Перекус'

        const recipeDiv = document.createElement('div')
        recipeDiv.style.marginBottom = '40px'
        recipeDiv.style.pageBreakInside = 'avoid'
        recipeDiv.innerHTML = `
          <h2 style="font-size: 20px; color: #3b82f6; margin-bottom: 8px; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px;">
            ${index + 1}. ${recipe.name}
          </h2>
          <p style="color: #666666; font-size: 12px; margin-bottom: 8px;">
            ${mealTypeText} | ${recipe.prepTime} мин | ${recipe.difficulty}
          </p>
          <p style="color: #666666; font-size: 11px; margin-bottom: 10px; line-height: 1.5;">
            ${recipe.description}
          </p>
          <p style="color: #000000; font-size: 12px; margin-bottom: 15px; font-weight: bold;">
            БЖУ: ${recipe.proteins}Б / ${recipe.fats}Ж / ${recipe.carbs}У | ${recipe.calories} ккал
          </p>
          
          <h3 style="font-size: 14px; color: #3b82f6; margin-bottom: 8px; margin-top: 15px;">
            Ингредиенты:
          </h3>
          <ul style="margin-left: 20px; margin-bottom: 15px; line-height: 1.8; font-size: 11px;">
            ${recipe.ingredients.map(ing => `<li>${ing.name} - ${ing.quantity}</li>`).join('')}
          </ul>
          
          <h3 style="font-size: 14px; color: #3b82f6; margin-bottom: 8px; margin-top: 15px;">
            Инструкция:
          </h3>
          <ol style="margin-left: 20px; line-height: 1.8; font-size: 11px;">
            ${recipe.instructions.map(step => `<li>${step}</li>`).join('')}
          </ol>
        `
        printContent.appendChild(recipeDiv)
      })

      // Добавляем элемент в DOM
      document.body.appendChild(printContent)

      // Используем html2canvas для создания изображения
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      // Удаляем временный элемент
      document.body.removeChild(printContent)

      // Конвертируем canvas в изображение и добавляем в PDF
      const { jsPDF } = await import('jspdf')
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const fileName = `Рецепты-для-чистой-кожи-${new Date().toLocaleDateString('ru-RU').replace(/\//g, '-')}.pdf`
      pdf.save(fileName)

      setDownloading(false)
    } catch (error) {
      console.error('Error generating PDF:', error)
      setDownloading(false)
      alert('Не удалось создать PDF файл. Попробуйте еще раз.')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-accent-electric/10 via-dark-800/50 to-accent-teal/10 border-2 border-accent-electric/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-electric to-accent-teal flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-dark-900" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Генератор рецептов для чистой кожи</h3>
          <p className="text-white/60 text-xs sm:text-sm">Персональные кето-рецепты без продуктов-триггеров</p>
        </div>
      </div>

      {/* Фильтр по типу приема пищи */}
      <div className="mb-4 sm:mb-6">
        <label className="text-white/80 text-xs sm:text-sm font-medium mb-2 block">Тип приема пищи:</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {[
            { value: 'all', label: 'Все' },
            { value: 'breakfast', label: 'Завтрак' },
            { value: 'lunch', label: 'Обед' },
            { value: 'dinner', label: 'Ужин' },
            { value: 'snack', label: 'Перекус' },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedMealType(option.value as any)}
              className={`py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                selectedMealType === option.value
                  ? 'bg-gradient-to-r from-accent-electric to-accent-teal text-dark-900 shadow-lg'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Выбор количества блюд */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
        <label className="text-white/80 text-xs sm:text-sm font-medium mb-3 block flex items-center gap-2">
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span>Сколько блюд сгенерировать:</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            max="10"
            value={dishCount}
            onChange={(e) => setDishCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
            className="w-20 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-center font-bold text-lg focus:outline-none focus:border-accent-electric/50"
          />
          <span className="text-white/60 text-sm">блюд (до {availableRecipes.length} доступно)</span>
        </div>
      </div>

      {/* Исключение продуктов */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
        <label className="text-white/80 text-xs sm:text-sm font-medium mb-2 sm:mb-3 block flex items-start sm:items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
          <span className="flex-1">Исключить продукты (аллергия, непереносимость, не нравится):</span>
        </label>
        
        {/* Часто исключаемые продукты */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          {COMMON_ALLERGENS.map(ingredient => (
            <button
              key={ingredient}
              onClick={() => toggleExclusion(ingredient)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
                excludedIngredients.includes(ingredient)
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
              }`}
            >
              {ingredient} {excludedIngredients.includes(ingredient) && '✕'}
            </button>
          ))}
        </div>

        {/* Пользовательские исключения */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newExclusion}
              onChange={(e) => setNewExclusion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomExclusion()}
              placeholder="Добавить продукт для исключения..."
              className="flex-1 px-3 sm:px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-accent-electric/50 text-xs sm:text-sm"
            />
            <button
              onClick={addCustomExclusion}
              className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-accent-electric to-accent-teal text-dark-900 font-medium hover:shadow-lg transition-all text-xs sm:text-sm whitespace-nowrap"
            >
              Добавить
            </button>
          </div>
          
          {customExclusions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {customExclusions.map(item => (
                <div
                  key={item}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium flex items-center gap-1.5 sm:gap-2"
                >
                  <span className="break-words">{item}</span>
                  <button
                    onClick={() => removeCustomExclusion(item)}
                    className="hover:text-red-300 flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Статистика и генератор */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/60 text-xs sm:text-sm">Доступно рецептов:</span>
              <span className="text-white font-bold text-base sm:text-lg">{availableRecipes.length}</span>
            </div>
            {selectedMealType !== 'all' && (
              <div className="text-xs text-white/50 mb-1">
                Тип приема пищи: {
                  selectedMealType === 'breakfast' ? 'Завтрак' :
                  selectedMealType === 'lunch' ? 'Обед' :
                  selectedMealType === 'dinner' ? 'Ужин' :
                  'Перекус'
                }
              </div>
            )}
            {(excludedIngredients.length > 0 || customExclusions.length > 0) && (
              <div className="text-xs text-white/50">
                Исключено продуктов: {excludedIngredients.length + customExclusions.length}
              </div>
            )}
          </div>
          {availableRecipes.length > 0 && (
            <button
              onClick={generateRandomRecipes}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-accent-gold to-accent-electric text-dark-900 font-medium hover:shadow-lg hover:shadow-accent-gold/30 transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            >
              <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>
                Сгенерировать {dishCount} {dishCount === 1 ? 'блюдо' : dishCount < 5 ? 'блюда' : 'блюд'}
                {selectedMealType !== 'all' && ` (${selectedMealType === 'breakfast' ? 'Завтрак' : selectedMealType === 'lunch' ? 'Обед' : selectedMealType === 'dinner' ? 'Ужин' : 'Перекус'})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Сгенерированные рецепты */}
      {generatedRecipes.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-white/5 border border-white/10">
          <ChefHat className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <p className="text-white/60 mb-2">Сгенерируйте рецепты для отображения</p>
          <p className="text-white/40 text-sm">Выберите количество блюд и нажмите кнопку генерации</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <div className="mb-4 p-3 rounded-xl bg-accent-electric/10 border border-accent-electric/30">
            <p className="text-white font-medium text-sm sm:text-base">
              Сгенерировано рецептов: <span className="text-accent-electric font-bold">{generatedRecipes.length}</span>
            </p>
          </div>
          {generatedRecipes.map((recipe) => (
            <motion.div
              key={recipe.id}
              id={`recipe-${recipe.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                borderColor: 'rgba(59, 130, 246, 0.5)',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
              }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-5 rounded-xl bg-white/5 border-2 transition-all"
            >
              {/* Изображение */}
              {recipe.image && (
                <div className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden mb-4">
                  <Image
                    src={recipe.image}
                    alt={recipe.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                  {recipe.image.includes('recipes/') && (
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
                  )}
                </div>
              )}

              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-accent-electric flex-shrink-0" />
                    <h4 className="text-base sm:text-lg font-bold text-white break-words">{recipe.name}</h4>
                    <span className="px-2 py-0.5 rounded text-xs bg-accent-electric/20 text-accent-electric whitespace-nowrap">
                      {recipe.mealType === 'breakfast' ? 'Завтрак' : 
                       recipe.mealType === 'lunch' ? 'Обед' : 
                       recipe.mealType === 'dinner' ? 'Ужин' : 'Перекус'}
                    </span>
                  </div>
                  <p className="text-white/60 text-xs sm:text-sm mb-2 break-words">{recipe.description}</p>
                  <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-white/50">
                    <span>⏱ {recipe.prepTime} мин</span>
                    <span>📊 {recipe.proteins}Б / {recipe.fats}Ж / {recipe.carbs}У</span>
                    <span>🔥 {recipe.calories} ккал</span>
                    <span>⭐ {recipe.difficulty}</span>
                  </div>
                </div>
              </div>

              {/* Польза для кожи */}
              {recipe.benefits.length > 0 && (
                <div className="mb-2 sm:mb-3 p-2.5 sm:p-3 rounded-lg bg-accent-mint/10 border border-accent-mint/20">
                  <div className="text-xs font-medium text-accent-mint mb-1.5">Польза для кожи:</div>
                  <ul className="space-y-1">
                    {recipe.benefits.map((benefit, idx) => (
                      <li key={idx} className="text-xs text-white/70 flex items-start gap-1.5 break-words">
                        <CheckCircle2 className="w-3 h-3 text-accent-mint mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ингредиенты */}
              <div className="mb-2 sm:mb-3">
                <div className="text-xs sm:text-sm font-medium text-white/80 mb-1.5 sm:mb-2">Ингредиенты:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                  {recipe.ingredients.map((ing, idx) => (
                    <div key={idx} className="text-xs sm:text-sm text-white/70 flex items-start gap-1.5 sm:gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-electric mt-1.5 sm:mt-2 flex-shrink-0"></span>
                      <span className="break-words">{ing.name} - {ing.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Инструкция */}
              <div>
                <div className="text-xs sm:text-sm font-medium text-white/80 mb-1.5 sm:mb-2">Инструкция:</div>
                <ol className="space-y-1.5 sm:space-y-2">
                  {recipe.instructions.map((step, idx) => (
                    <li key={idx} className="text-xs sm:text-sm text-white/70 flex items-start gap-2">
                      <span className="text-accent-electric font-medium flex-shrink-0">{idx + 1}.</span>
                      <span className="break-words">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Кнопка скачать PDF */}
      {generatedRecipes.length > 0 && (
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-accent-electric to-accent-teal text-dark-900 font-medium hover:shadow-lg hover:shadow-accent-electric/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {downloading ? (
            <>
              <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
              <span>Создание PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Скачать {generatedRecipes.length} {generatedRecipes.length === 1 ? 'рецепт' : generatedRecipes.length < 5 ? 'рецепта' : 'рецептов'} в PDF</span>
            </>
          )}
        </button>
      )}
    </motion.div>
  )
}

