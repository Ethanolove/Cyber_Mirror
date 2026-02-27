<template>
  <Radar :data="chartData" :options="chartOptions" />
</template>

<script>
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'
import { Radar } from 'vue-chartjs'
import ChartDataLabels from 'chartjs-plugin-datalabels'

// On enregistre les composants normaux + le nouveau plugin Datalabels
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, ChartDataLabels)

export default {
  name: 'RadarChart',
  components: { Radar },
  props: {
    scores: {
      type: Object,
      required: true
    }
  },
  computed: {
    chartData() {
      // 1. Récupération des scores (ratio entre 0 et 1)
      const dataValues = [
        this.scores['Mots de passe']?.ratio || 0,
        this.scores['Navigation web']?.ratio || 0,
        this.scores['Emails / Phishing']?.ratio || 0,
        this.scores['Réseaux sociaux']?.ratio || 0
      ];

      // 2. Logique de coloration stricte du Vert au Rouge
      const pointColors = dataValues.map(val => {
        if (val <= 0.33) return 'rgb(34, 197, 94)';   // Vert (Faible)
        if (val <= 0.66) return 'rgb(249, 115, 22)';  // Orange (Modéré)
        return 'rgb(239, 68, 68)';                    // Rouge (Élevé)
      });

      return {
        labels: ['Mots de passe', 'Navigation Web', 'Emails', 'Réseaux Sociaux'],
        datasets: [
          {
            label: 'Vulnérabilité',
            backgroundColor: 'rgba(28, 78, 216, 0.1)', // Plus léger pour la toile
            borderColor: 'rgba(28, 78, 216, 0.3)',      // Ligne bleue discrète
            pointBackgroundColor: pointColors,          // Couleurs Vert/Orange/Rouge
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            data: dataValues
          }
        ]
      }
    },
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: window.devicePixelRatio || 2, // Force une haute résolution
        layout: {
          padding: {
            top: 10,
            bottom: 10,
            left: 55,
            right: 55
          }
        },
        elements: {
          line: {
            borderWidth: 2,
            tension: 0.1 // Très légère courbe pour éviter l'aspect "escalier"
          },
          point: {
            radius: 5,
            borderWidth: 2
          }
        },
        scales: {
          r: {
            angleLines: { 
              display: true,
              color: 'rgba(0, 0, 0, 0.08)',
              lineWidth: 1
            },
            grid: { 
              color: 'rgba(0, 0, 0, 0.08)',
              lineWidth: 1
            },
            min: 0,
            max: 1,
            pointLabels: {
              font: { size: 10, weight: '800' }, 
              color: '#334155',
              padding: 8
            },
            ticks: {
              stepSize: 0.33,
              color: '#cbd5e1', // Gris clair plus discret
              backdropColor: 'transparent',
              font: { size: 9 }, // Plus petit
              callback: function(value) {
                if (value === 0.33) return 'FAIBLE';
                if (value === 0.66) return 'MODÉRÉ';
                if (value === 0.99 || value === 1) return 'ÉLEVÉ';
                return '';
              }
            }
          }
        },
        plugins: {
          legend: { display: false },
          datalabels: {
            color: (context) => context.dataset.pointBackgroundColor[context.dataIndex],
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 4,
            padding: { top: 4, bottom: 4, left: 6, right: 6 },
            font: { weight: '900', size: 13 },
            anchor: 'end',
            align: 'top',
            offset: 12, // Écarté du centre
            formatter: (value) => Math.round(value * 100) + '%' // Format Pourcentage
          }
        }
      }
    }
  }
}
</script>