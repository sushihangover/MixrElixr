let showShowDeleted = true;

export function setup(options) {
    showShowDeleted = options.showWhoDeletedMessage !== false;
    if (showShowDeleted) {
        $('.me-deleted-by').show();
    } else {
        $('.me-deleted-by').hide();
    }
}

export function messagedDeleted(messageId, moderatorName) {
    if (!showShowDeleted) return;

    let chatMessage = $(`[data-id='${messageId}']`).find("[class*='message_']");
    if (chatMessage == null || chatMessage.length < 1) return;

    $(`
        <div class="me-deleted-by">(Deleted by ${moderatorName})</div>
    `).prependTo(chatMessage);
}
