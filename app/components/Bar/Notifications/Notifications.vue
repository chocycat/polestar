<script lang="ts" setup>
import { animate, utils } from "animejs";
import { sortBy } from "es-toolkit";
import type BarPopup from "../Popup.vue";

const { notifications: _notifications } = storeToRefs(useNotifications());
const { close, clear } = useNotifications();
const { enter: enterScale, leave: leaveScale } = useScaleTransition();

const notifications = computed(() =>
	sortBy(_notifications.value, [(n) => -n.id]),
);

const popup = ref<InstanceType<typeof BarPopup>>();
const notifWrapper = ref<HTMLElement>();
const notifList = ref<HTMLElement>();

const { height: wrapperHeight } = useElementSize(notifWrapper);
const { height: listHeight } = useElementSize(notifList);

const showBar = computed(() => listHeight.value > wrapperHeight.value);

watch(
	notifications,
	() => {
		nextTick(() => {
			popup.value?.update?.();
		});
	},
	{ deep: true, flush: "post" },
);

function enter(target: Element, onComplete: () => void) {
	animate(target, {
		opacity: { from: 0 },
		filter: { from: "blur(32px)" },
		scale: { from: 1.25 },
		duration: 250,
		ease: "outExpo",
		onComplete: (self) => {
			utils.cleanInlineStyles(self);
			onComplete();
		},
	});
}

function leave(target: Element, onComplete: () => void) {
	const top = (target as HTMLElement).offsetTop;
	const left = (target as HTMLElement).offsetLeft;
	const { width, height } = (target as HTMLElement).getBoundingClientRect();

	(target as HTMLElement).style.setProperty("top", `${top}px`);
	(target as HTMLElement).style.setProperty("left", `${left}px`);
	(target as HTMLElement).style.setProperty("width", `${width}px`);
	(target as HTMLElement).style.setProperty("height", `${height}px`);

	animate(target, {
		position: "absolute",
		zIndex: 0,
		filter: "blur(32px)",
		opacity: 0,
		scale: 0.75,
		duration: 250,
		ease: "outQuad",
		onComplete: (self) => {
			utils.cleanInlineStyles(self);
			onComplete();
		},
	});
}
</script>

<template>
  <BarPopup
    ref="popup"
    id="barNotifications"
    is="button"
    skew="right"
    class="notifications"
  >
    <div
      class="w-auto aspect-square h-full flex justify-center gap-3 items-center px-6"
    >
      <Icon
        name="ri:notification-3-fill"
        class="text-lg text-brand-muted unskew"
      />
    </div>

    <template #content>
      <div class="flex justify-between items-center mb-2 h-28px">
        <div class="flex items-center gap-1 font-semibold px-2 unskew">
          <h1>Notifications</h1>
          <h2 class="text-accent-light">{{ notifications.length }}</h2>
        </div>

        <Button
          v-if="notifications.length > 0"
          class="font-semibold !px-3 !py-1 !bg-brand-elevated hover:!bg-brand-border rounded-md text-sm"
          @click="clear"
        >
          <div class="unskew">Clear All</div>
        </Button>
      </div>

      <Transition @enter="enterScale" @leave="leaveScale">
        <div v-if="notifications.length > 0" class="w-350px">
          <Scrollbar :delta="64" :show-bar="showBar">
            <div ref="notifWrapper" class="max-h-252px">
              <TransitionGroup
                ref="notifList"
                tag="div"
                name="notification"
                class="flex flex-col gap-1"
                @enter="enter"
                @leave="leave"
              >
                <BarNotificationsContent
                  v-for="(n, i) in notifications"
                  :key="n.id"
                  :notification="n"
                  :data-index="i"
                  @close="close(n.id)"
                />
              </TransitionGroup>
            </div>
          </Scrollbar>
        </div>
        <div
          v-else
          class="w-350px h-118px flex flex-col justify-center items-center gap-2 text-brand-subtle"
        >
          <Icon name="ri:inbox-2-fill" class="unskew text-lg" />
          <p class="unskew">You're all caught up!</p>
        </div>
      </Transition>
    </template>
  </BarPopup>
</template>
