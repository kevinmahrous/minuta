import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import "@fontsource/inter";
import PrimeVue from "primevue/config";
import { teal } from "./theme/teal";
import Ripple from "primevue/ripple";
import router from "./router";
import Badge from "primevue/badge";
import Menubar from "primevue/menubar";
import Button from "primevue/button";
import Message from "primevue/message";
import FileUpload from "primevue/fileupload";
import Password from "primevue/password";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
import InputNumber from "primevue/inputnumber";
import Textarea from "primevue/textarea";
import Dialog from "primevue/dialog";
import ColorPicker from "primevue/colorpicker";
import MultiSelect from "primevue/multiselect";
import ToastService from "primevue/toastservice";
import Toast from "primevue/toast";
import Divider from "primevue/divider";
import Select from "primevue/select";
import Dataview from "primevue/dataview";
import DatePicker from "primevue/datepicker";
import Popover from "primevue/popover";
import Tooltip from "primevue/tooltip";
const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: teal,
    options: {
      darkModeSelector: ".dark",
      prefix: "p",
    },
  },
  ripple: true,
});

app.directive("ripple", Ripple);
app.component("Badge", Badge);
app.component("Menubar", Menubar);
app.component("Button", Button);
app.component("Toast", Toast);
app.component("Password", Password);
app.component("InputText", InputText);
app.component("Message", Message);
app.component("FileUpload", FileUpload);
app.component("Tag", Tag);
app.component("InputNumber", InputNumber);
app.component("Textarea", Textarea);
app.component("ColorPicker", ColorPicker);
app.component("Dialog", Dialog);
app.component("MultiSelect", MultiSelect);
app.component("Divider", Divider);
app.component("Select", Select);
app.component("DataView", Dataview);
app.component("DatePicker", DatePicker);
app.component("Popover", Popover);
app.directive("tooltip", Tooltip);
app.use(router);
app.use(ToastService);
app.mount("#app");
