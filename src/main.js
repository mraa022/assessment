import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from "primevue/config"
import Aura from "@primevue/themes/aura"
import OrganizationChart from 'primevue/organizationchart';

const app = createApp(App);

app.use(PrimeVue,{
    theme:{
        preset:Aura,
    }
})
app.component("OrganizationChart", OrganizationChart);
app.mount('#app');
