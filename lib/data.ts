export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  specs: {
    material: string;
    weight: string;
    dimensions: string;
  };
  isLimited?: boolean;
}

export const PRODUCTS: Product[] = [
  {
    id: "anel-obsidiana",
    name: "Anel de Diamante Aurora",
    price: 12450,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwr8wgxb3SS4Lvp6RpF-UFxxVrDhCZePwm3iwszyuXM9WjvW193ovIhqghbmEIlsiVthoDvsedhsDptdGPcKlbU0cfvy0moCmkr5nr0IC4h-NK8Pd2BYpnBUl5eub4in_dSGM-yH9TFrF3wd121G-lIkx5wcT7dI23kGQAg0VFz-SMfqa8rpv39HN6dN7kWj6_SX9XqQZ9lmJjJVBVuPltCAxkoiKAZn63zXXRWhp6xXdiJh20OH0ELyoSjOHMaOKliyovIk-GRSs",
    category: "aneis",
    description: "Um anel de presença inegável. A obsidiana negra central absorve a luz, criando um contraste dramático com a estrutura geométrica em ouro 18k.",
    specs: {
      material: "Ouro 18k e Obsidiana Negra",
      weight: "12g",
      dimensions: "15mm x 15mm"
    },
    isLimited: true
  },
  {
    id: "colar-eclipse",
    name: "Colar Gold Infinite",
    price: 8900,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD1qpRxMzfadEsbzRqtrH7mmeWhO8ByirtB55bR3qlU5Qdo5QPIqbk2NTJ4B_xiWUNiIlTbkxSFOgkNGfoqEWjYVw-ixkLjzIsYZjDFLF7_fsWcfYTUIuHWOldHzvE59NZgzdyjQoW0XQuzuyRczNeXaqxmS160EqQfohQbQkqhtiIyJ7z-kbo51I5CeUsJNA4rQvbPM4ogUc5Cz9329TbWKjnPACLpfvZjWyJjjYANNwzU7YfTVorPta8PV6t994IZLeS2Oy70gJ8",
    category: "colares",
    description: "A dualidade da luz e da sombra em uma peça. O pendente circular revela um pavé de diamantes negros de um lado, e ouro polido do outro.",
    specs: {
      material: "Ouro Misto 18k, Diamantes Negros (2ct)",
      weight: "28g",
      dimensions: "Corrente 45cm, Pendente 25mm"
    }
  },
  {
    id: "brinco-geometria",
    name: "Brincos Orion Sapphire",
    price: 15200,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCM-nGDJ8GOLNFSyW_OGmg4s1VGwmXPdhOY8RI1Ifav_D5MsJJAqUZfbIh47pIFD7ij3dvYz0va_zrGRW68y4z91o_T1VNXu5Xz_il_IipTEggqdSu-1_4CPnDzLcL6duynjWnlffnjAp7zghAhBeRuWNKIewQJEYo8jcIWcFr6f5WdbJM1qOVME_y71hPYs1Mb_TYq5rugq1LKxDUerUaNhlfCWL_V1Gh0x4UWfwKOU8XsdFLT775jGtjLRvsOPsf0YbKgYo8d2L4",
    category: "brincos",
    description: "Design arquitetônico que desafia a gravidade. Linhas retas e ângulos precisos criam um volume impressionante com peso mínimo.",
    specs: {
      material: "Ouro Branco 18k",
      weight: "6g (par)",
      dimensions: "40mm drop"
    }
  },
  {
    id: "bracelete-vortex",
    name: "Pulseira Eternity Gold",
    price: 6750,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzFu2XxU6MgWkADUzQwfmPe3cXbt-34QSoXRHt2KfNbfb9ltFWD1iB_HSZ8e9t-hRBxsmrG2ohej2Q9JhdDSq1k6g20b0KzxNgPywiBdt7Co05LYgKkMdNVrC8NtbkxIWcWQ_PH9-2TKKBX3yTgo8Ut6efRQAFrr0TKtVAGRngKLeaevEfUJOR5poaKWP_HYfecGp9N8SV72gimEt7zvf8sEMQ8JrWBabASTJvEEiEXjcJadCS50gy1jAXi3jts549A-_76gFytXk",
    category: "pulseiras",
    description: "Uma fita contínua de ouro maciço que envolve o pulso com uma tensão elegante. Sem fechos aparentes, engenharia invisível.",
    specs: {
      material: "Ouro Amarelo 18k",
      weight: "45g",
      dimensions: "60mm diâmetro interno"
    }
  },
  {
    id: "anel-singular",
    name: "Anel Singularidade",
    price: 18500,
    image: "https://picsum.photos/seed/anel2/800/1000",
    category: "aneis",
    description: "Um diamante de corte esmeralda suspenso em uma montagem de tensão. A luz atravessa a pedra de todos os ângulos.",
    specs: {
      material: "Platina, Diamante (1.5ct)",
      weight: "8g",
      dimensions: "Banda 3mm"
    },
    isLimited: true
  },
  {
    id: "colar-zenith",
    name: "Colar Zenith",
    price: 45000,
    image: "https://picsum.photos/seed/colar2/800/1000",
    category: "colares",
    description: "Nossa peça mestre. O Colar Zenith representa o ápice da alta joalheria, com uma cascata de diamantes cuidadosamente selecionados.",
    specs: {
      material: "Platina, Diamantes Brancos (5ct)",
      weight: "52g",
      dimensions: "Corrente 40cm ajustável"
    }
  }
];

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
};
