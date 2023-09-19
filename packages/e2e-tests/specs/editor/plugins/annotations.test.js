/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	clickBlockToolbarButton,
	clickMenuItem,
	clickOnMoreMenuItem,
	createNewPost,
	deactivatePlugin,
	canvas,
} from '@wordpress/e2e-test-utils';

const clickOnBlockSettingsMenuItem = async ( buttonLabel ) => {
	await clickBlockToolbarButton( 'Options' );
	await clickMenuItem( buttonLabel );
};

const ANNOTATIONS_SELECTOR = '.annotation-text-e2e-tests';

describe( 'Annotations', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-plugin-plugins-api' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-plugin-plugins-api' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	/**
	 * Annotates the text in the first block from start to end.
	 *
	 * @param {number} start Position to start the annotation.
	 * @param {number} end   Position to end the annotation.
	 *
	 * @return {void}
	 */
	async function annotateFirstBlock( start, end ) {
		await page.focus( '#annotations-tests-range-start' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( start + '' );
		await page.focus( '#annotations-tests-range-end' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( end + '' );

		// Click add annotation button.
		const addAnnotationButton = (
			await page.$x( "//button[contains(text(), 'Add annotation')]" )
		)[ 0 ];
		await addAnnotationButton.click();
		await canvas().evaluate( () =>
			document.querySelector( '.wp-block-paragraph' ).focus()
		);
	}

	/**
	 * Presses the button that removes all annotations.
	 *
	 * @return {void}
	 */
	async function removeAnnotations() {
		// Click remove annotations button.
		const addAnnotationButton = (
			await page.$x( "//button[contains(text(), 'Remove annotations')]" )
		)[ 0 ];
		await addAnnotationButton.click();
		await canvas().evaluate( () =>
			document.querySelector( '[contenteditable]' ).focus()
		);
	}

	/**
	 * Returns the inner text of the first text annotation on the page.
	 *
	 * @return {Promise<string>} The annotated text.
	 */
	async function getAnnotatedText() {
		const annotations = await canvas().$$( ANNOTATIONS_SELECTOR );

		const annotation = annotations[ 0 ];

		return await canvas().evaluate( ( el ) => el.innerText, annotation );
	}

	/**
	 * Returns the inner HTML of the first RichText in the page.
	 *
	 * @return {Promise<string>} Inner HTML.
	 */
	async function getRichTextInnerHTML() {
		const htmlContent = await canvas().$$( '.wp-block-paragraph' );
		return await canvas().evaluate( ( el ) => {
			return el.innerHTML;
		}, htmlContent[ 0 ] );
	}

	it( 'allows a block to be annotated', async () => {
		await page.keyboard.type( 'Title' + '\n' + 'Paragraph to annotate' );

		await clickOnMoreMenuItem( 'Annotations' );

		let annotations = await canvas().$$( ANNOTATIONS_SELECTOR );
		expect( annotations ).toHaveLength( 0 );

		await annotateFirstBlock( 9, 13 );

		annotations = await canvas().$$( ANNOTATIONS_SELECTOR );
		expect( annotations ).toHaveLength( 1 );

		const text = await getAnnotatedText();
		expect( text ).toBe( ' to ' );

		await clickOnBlockSettingsMenuItem( 'Edit as HTML' );

		const htmlContent = await canvas().$$(
			'.block-editor-block-list__block-html-textarea'
		);
		const html = await canvas().evaluate( ( el ) => {
			return el.innerHTML;
		}, htmlContent[ 0 ] );

		// There should be no <mark> tags in the raw content.
		expect( html ).toBe( '&lt;p&gt;Paragraph to annotate&lt;/p&gt;' );
	} );

	it( 'keeps the cursor in the same location when applying annotation', async () => {
		await page.keyboard.type( 'Title' + '\n' + 'ABC' );
		await clickOnMoreMenuItem( 'Annotations' );

		await annotateFirstBlock( 1, 2 );

		// The selection should still be at the end, so test that by typing:
		await page.keyboard.type( 'D' );

		await removeAnnotations();
		const htmlContent = await canvas().$$( '.wp-block-paragraph' );
		const html = await canvas().evaluate( ( el ) => {
			return el.innerHTML;
		}, htmlContent[ 0 ] );

		expect( html ).toBe( 'ABCD' );
	} );

	it( 'moves when typing before it', async () => {
		await page.keyboard.type( 'Title' + '\n' + 'ABC' );
		await clickOnMoreMenuItem( 'Annotations' );

		await annotateFirstBlock( 1, 2 );

		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );

		// Put an 1 after the A, it should not be annotated.
		await page.keyboard.type( '1' );

		const annotatedText = await getAnnotatedText();
		expect( annotatedText ).toBe( 'B' );

		await removeAnnotations();
		const blockText = await getRichTextInnerHTML();
		expect( blockText ).toBe( 'A1BC' );
	} );

	it( 'grows when typing inside it', async () => {
		await page.keyboard.type( 'Title' + '\n' + 'ABC' );
		await clickOnMoreMenuItem( 'Annotations' );

		await annotateFirstBlock( 1, 2 );

		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );

		// Put an 1 after the A, it should not be annotated.
		await page.keyboard.type( '2' );

		const annotatedText = await getAnnotatedText();
		expect( annotatedText ).toBe( 'B2' );

		await removeAnnotations();
		const blockText = await getRichTextInnerHTML();
		expect( blockText ).toBe( 'AB2C' );
	} );
} );
