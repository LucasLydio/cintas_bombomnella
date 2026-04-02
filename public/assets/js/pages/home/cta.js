document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".find-here");
  console.log('Teste')

  sections.forEach((section) => {
    const track = section.querySelector(".find-here__viewport, .find-here__track");
    const grid = section.querySelector(".find-here__grid");
    const leftBtn = section.querySelector(".find-here__nav--left");
    const rightBtn = section.querySelector(".find-here__nav--right");

    if (!track || !grid || !leftBtn || !rightBtn) return;

    const getStep = () => {
      const firstItem = grid.querySelector(".find-here__item");
      if (!firstItem) return 220;

      const itemStyles = window.getComputedStyle(firstItem);
      const gridStyles = window.getComputedStyle(grid);

      const itemWidth = firstItem.getBoundingClientRect().width;
      const gap = parseFloat(gridStyles.columnGap || gridStyles.gap || 0);
      const marginLeft = parseFloat(itemStyles.marginLeft || 0);
      const marginRight = parseFloat(itemStyles.marginRight || 0);

      return itemWidth + gap + marginLeft + marginRight;
    };

    const updateButtons = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      const currentScroll = Math.round(track.scrollLeft);

      leftBtn.disabled = currentScroll <= 0;
      rightBtn.disabled = currentScroll >= maxScroll - 2;

      leftBtn.classList.toggle("is-disabled", leftBtn.disabled);
      rightBtn.classList.toggle("is-disabled", rightBtn.disabled);
    };

    const scrollToSide = (direction) => {
      track.scrollBy({
        left: getStep() * direction,
        behavior: "smooth",
      });
    };

    leftBtn.addEventListener("click", () => scrollToSide(-1));
    rightBtn.addEventListener("click", () => scrollToSide(1));

    track.addEventListener("scroll", updateButtons);
    window.addEventListener("resize", updateButtons);

    updateButtons();
  });
});